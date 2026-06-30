from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import mysql.connector
import uuid
import hashlib

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── DB connection ─────────────────────────────────────────────────────────────

def get_db():
    db = mysql.connector.connect(
        host="localhost",
        user="root",
        password="Incapp11912",
        database="kitchenmate",
    )
    cursor = db.cursor(dictionary=True)
    try:
        yield db, cursor
    finally:
        cursor.close()
        db.close()


# ── Password hashing ──────────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    """SHA-256 hash — simple, no extra dependencies needed."""
    return hashlib.sha256(password.encode()).hexdigest()


# ── Pydantic Models ───────────────────────────────────────────────────────────

class AdminSignupRequest(BaseModel):
    user_name: str
    user_address: str
    contact: str
    password: str
    group_name: str


class UserSignupRequest(BaseModel):
    user_name: str
    user_address: str
    contact: str
    password: str
    invite_code: str


class LoginRequest(BaseModel):
    user_name: str
    password: str


class GroupRequest(BaseModel):
    group_name: str


class ExpenseRequest(BaseModel):
    group_id: int
    paid_by: int
    amount: float
    expense_date: str
    description: str
    users: List[int]


# ── Helper ────────────────────────────────────────────────────────────────────

def require_admin(group_id: int, user_id: int, cursor):
    """Raise 403 if user_id is not the admin of group_id."""
    cursor.execute(
        "SELECT admin_id FROM `groups` WHERE group_id = %s", (group_id,)
    )
    row = cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Group not found")
    if row["admin_id"] != user_id:
        raise HTTPException(status_code=403, detail="Admin access required")


# ── Admin signup ──────────────────────────────────────────────────────────────

@app.post("/admin/signup")
def admin_signup(req: AdminSignupRequest, db_dep=Depends(get_db)):
    db, cursor = db_dep

    # Duplicate username check
    cursor.execute("SELECT user_id FROM users WHERE user_name = %s", (req.user_name,))
    if cursor.fetchone():
        raise HTTPException(status_code=400, detail="Username already taken")

    # Validate group name
    if not req.group_name.strip():
        raise HTTPException(status_code=400, detail="Group name cannot be empty")

    # Create admin user with hashed password
    cursor.execute(
        "INSERT INTO users (user_name, user_password, user_address, user_contact, role) "
        "VALUES (%s, %s, %s, %s, 'admin')",
        (req.user_name, hash_password(req.password), req.user_address, req.contact),
    )
    db.commit()
    user_id = cursor.lastrowid

    # Create the group
    invite_code = uuid.uuid4().hex[:10]
    cursor.execute(
        "INSERT INTO `groups` (group_name, invite_code, admin_id) VALUES (%s, %s, %s)",
        (req.group_name.strip(), invite_code, user_id),
    )
    db.commit()
    group_id = cursor.lastrowid

    # Admin is auto-accepted member with zero balance
    cursor.execute(
        "INSERT INTO group_members (group_id, user_id, status) VALUES (%s, %s, 'accepted')",
        (group_id, user_id),
    )
    cursor.execute(
        "INSERT INTO user_balance (user_id, group_id, amount) VALUES (%s, %s, 0)",
        (user_id, group_id),
    )
    db.commit()

    return {
        "message": "Admin account and group created successfully",
        "user_id": user_id,
        "group_id": group_id,
        "group_name": req.group_name.strip(),
        "invite_code": invite_code,
    }


# ── User signup (invite only) ─────────────────────────────────────────────────

@app.post("/user/signup")
def user_signup(req: UserSignupRequest, db_dep=Depends(get_db)):
    db, cursor = db_dep

    # Validate invite code first
    cursor.execute(
        "SELECT group_id, group_name FROM `groups` WHERE invite_code = %s",
        (req.invite_code,),
    )
    group = cursor.fetchone()
    if not group:
        raise HTTPException(status_code=400, detail="Invalid or expired invite code")

    # Duplicate username check
    cursor.execute("SELECT user_id FROM users WHERE user_name = %s", (req.user_name,))
    if cursor.fetchone():
        raise HTTPException(status_code=400, detail="Username already taken")

    # Create user with hashed password
    cursor.execute(
        "INSERT INTO users (user_name, user_password, user_address, user_contact, role) "
        "VALUES (%s, %s, %s, %s, 'user')",
        (req.user_name, hash_password(req.password), req.user_address, req.contact),
    )
    db.commit()
    user_id = cursor.lastrowid

    # Check if already a member (e.g. duplicate request)
    cursor.execute(
        "SELECT status FROM group_members WHERE group_id = %s AND user_id = %s",
        (group["group_id"], user_id),
    )
    if not cursor.fetchone():
        cursor.execute(
            "INSERT INTO group_members (group_id, user_id, status) VALUES (%s, %s, 'pending')",
            (group["group_id"], user_id),
        )
        db.commit()

    return {
        "message": "Account created! Waiting for admin approval.",
        "user_id": user_id,
        "group_name": group["group_name"],
    }


# ── Login ─────────────────────────────────────────────────────────────────────

@app.post("/login")
def login(req: LoginRequest, db_dep=Depends(get_db)):
    db, cursor = db_dep

    cursor.execute(
        "SELECT user_id, user_name, user_address, user_contact, role "
        "FROM users WHERE user_name = %s AND user_password = %s",
        (req.user_name, hash_password(req.password)),
    )
    user = cursor.fetchone()

    if not user:
        raise HTTPException(status_code=401, detail="Incorrect username or password")

    # For member users: check they have at least one accepted group
    # (Admin can always log in — they own groups)
    if user["role"] == "user":
        cursor.execute(
            "SELECT COUNT(*) AS cnt FROM group_members "
            "WHERE user_id = %s AND status = 'accepted'",
            (user["user_id"],),
        )
        accepted = cursor.fetchone()["cnt"]
        # We still let them log in even if pending — frontend shows pending screen
        # But we want to include their pending status in the response
        cursor.execute(
            "SELECT COUNT(*) AS cnt FROM group_members "
            "WHERE user_id = %s AND status = 'pending'",
            (user["user_id"],),
        )
        pending = cursor.fetchone()["cnt"]
    else:
        accepted = 1
        pending = 0

    return {
        "message": "Login successful",
        "user": {
            "user_id":      user["user_id"],
            "user_name":    user["user_name"],
            "user_address": user["user_address"],
            "contact":      user["user_contact"],
            "role":         user["role"],
            "has_accepted": accepted > 0,
            "has_pending":  pending > 0,
        },
    }


# ── Create additional group (admin only) ──────────────────────────────────────

@app.post("/groups")
def create_group(
    group: GroupRequest,
    user_id: int = Query(...),
    db_dep=Depends(get_db),
):
    db, cursor = db_dep

    # Only admins can create groups
    cursor.execute("SELECT role FROM users WHERE user_id = %s", (user_id,))
    u = cursor.fetchone()
    if not u or u["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admins can create groups")

    if not group.group_name.strip():
        raise HTTPException(status_code=400, detail="Group name cannot be empty")

    invite_code = uuid.uuid4().hex[:10]
    cursor.execute(
        "INSERT INTO `groups` (group_name, invite_code, admin_id) VALUES (%s, %s, %s)",
        (group.group_name.strip(), invite_code, user_id),
    )
    db.commit()
    group_id = cursor.lastrowid

    cursor.execute(
        "INSERT INTO group_members (group_id, user_id, status) VALUES (%s, %s, 'accepted')",
        (group_id, user_id),
    )
    cursor.execute(
        "INSERT INTO user_balance (user_id, group_id, amount) VALUES (%s, %s, 0)",
        (user_id, group_id),
    )
    db.commit()

    return {
        "group_id":    group_id,
        "group_name":  group.group_name.strip(),
        "invite_code": invite_code,
    }


# ── Get groups for a user ─────────────────────────────────────────────────────

@app.get("/groups")
def get_groups(user_id: int = Query(...), db_dep=Depends(get_db)):
    db, cursor = db_dep

    cursor.execute(
        "SELECT g.group_id, g.group_name, g.invite_code, g.admin_id, gm.status "
        "FROM `groups` g "
        "JOIN group_members gm ON g.group_id = gm.group_id "
        "WHERE gm.user_id = %s "
        "ORDER BY g.group_id DESC",
        (user_id,),
    )
    rows = cursor.fetchall()

    return [
        {
            "group_id":    row["group_id"],
            "group_name":  row["group_name"],
            "invite_code": row["invite_code"],
            "admin_id":    row["admin_id"],
            "status":      row["status"],
            "is_admin":    row["admin_id"] == user_id,
        }
        for row in rows
    ]


# ── Verify member access to a group dashboard ─────────────────────────────────

@app.get("/groups/{group_id}/verify-access")
def verify_access(
    group_id: int,
    user_id: int = Query(...),
    db_dep=Depends(get_db),
):
    db, cursor = db_dep

    cursor.execute(
        "SELECT status FROM group_members WHERE group_id = %s AND user_id = %s",
        (group_id, user_id),
    )
    row = cursor.fetchone()

    if not row:
        raise HTTPException(status_code=403, detail="Not a member of this group")
    if row["status"] != "accepted":
        raise HTTPException(status_code=403, detail="Membership pending admin approval")

    return {"access": True}


# ── Pending join requests (admin only) ───────────────────────────────────────

@app.get("/groups/{group_id}/requests")
def get_group_requests(
    group_id: int,
    admin_id: int = Query(...),
    db_dep=Depends(get_db),
):
    db, cursor = db_dep
    require_admin(group_id, admin_id, cursor)

    cursor.execute(
        "SELECT gm.user_id, u.user_name, u.user_contact "
        "FROM group_members gm "
        "JOIN users u ON gm.user_id = u.user_id "
        "WHERE gm.group_id = %s AND gm.status = 'pending' "
        "ORDER BY gm.user_id DESC",
        (group_id,),
    )
    return [
        {
            "user_id":   r["user_id"],
            "user_name": r["user_name"],
            "contact":   r["user_contact"],
        }
        for r in cursor.fetchall()
    ]


# ── Accept member (admin only) ────────────────────────────────────────────────

@app.post("/groups/{group_id}/accept/{user_id}")
def accept_member(
    group_id: int,
    user_id: int,
    admin_id: int = Query(...),
    db_dep=Depends(get_db),
):
    db, cursor = db_dep
    require_admin(group_id, admin_id, cursor)

    cursor.execute(
        "UPDATE group_members SET status = 'accepted' "
        "WHERE group_id = %s AND user_id = %s AND status = 'pending'",
        (group_id, user_id),
    )
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Pending request not found")

    cursor.execute(
        "INSERT IGNORE INTO user_balance (user_id, group_id, amount) VALUES (%s, %s, 0)",
        (user_id, group_id),
    )
    db.commit()

    return {"message": "Member accepted successfully"}


# ── Reject / remove member (admin only) ──────────────────────────────────────

@app.post("/groups/{group_id}/reject/{user_id}")
def reject_member(
    group_id: int,
    user_id: int,
    admin_id: int = Query(...),
    db_dep=Depends(get_db),
):
    db, cursor = db_dep
    require_admin(group_id, admin_id, cursor)

    cursor.execute(
        "DELETE FROM group_members WHERE group_id = %s AND user_id = %s",
        (group_id, user_id),
    )
    db.commit()

    return {"message": "Request declined"}


# ── Get accepted members of a group ──────────────────────────────────────────

@app.get("/users")
def get_users(group_id: int = Query(...), db_dep=Depends(get_db)):
    db, cursor = db_dep

    cursor.execute(
        "SELECT u.user_id, u.user_name, u.user_address, u.user_contact "
        "FROM users u "
        "JOIN group_members gm ON u.user_id = gm.user_id "
        "WHERE gm.group_id = %s AND gm.status = 'accepted' "
        "ORDER BY u.user_name",
        (group_id,),
    )
    return [
        {
            "user_id":      r["user_id"],
            "user_name":    r["user_name"],
            "user_address": r["user_address"],
            "contact":      r["user_contact"],
        }
        for r in cursor.fetchall()
    ]


# ── Add expense ───────────────────────────────────────────────────────────────

@app.post("/expenses")
def add_expense(expense: ExpenseRequest, db_dep=Depends(get_db)):
    db, cursor = db_dep

    # Validate amount
    if expense.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than zero")
    if not expense.users:
        raise HTTPException(status_code=400, detail="Select at least one user to split with")

    # Verify payer is an accepted member
    cursor.execute(
        "SELECT status FROM group_members WHERE group_id = %s AND user_id = %s",
        (expense.group_id, expense.paid_by),
    )
    row = cursor.fetchone()
    if not row or row["status"] != "accepted":
        raise HTTPException(status_code=403, detail="Payer is not an accepted member")

    # Get payer name
    cursor.execute("SELECT user_name FROM users WHERE user_id = %s", (expense.paid_by,))
    payer = cursor.fetchone()
    paid_by_name = payer["user_name"] if payer else "Unknown"

    # Insert expense
    cursor.execute(
        "INSERT INTO expenses (group_id, paid_by, paid_by_name, amount, expense_date, description) "
        "VALUES (%s, %s, %s, %s, %s, %s)",
        (
            expense.group_id,
            expense.paid_by,
            paid_by_name,
            round(expense.amount, 2),
            expense.expense_date,
            expense.description.strip(),
        ),
    )
    db.commit()
    expense_id = cursor.lastrowid

    # Split evenly — remainder goes to payer
    n = len(expense.users)
    base_share = round(expense.amount / n, 2)
    total_assigned = base_share * n
    remainder = round(expense.amount - total_assigned, 2)

    for i, uid in enumerate(expense.users):
        share = base_share + (remainder if i == 0 else 0)   # first user absorbs rounding diff
        balance = round(share - share, 2) if uid != expense.paid_by else round(expense.amount - share, 2)

        # Recalculate correctly:
        # payer gets back (total - their_share), others owe (-their_share)
        if uid == expense.paid_by:
            balance = round(expense.amount - share, 2)
        else:
            balance = round(-share, 2)

        cursor.execute(
            "INSERT INTO expense_shares (expense_id, user_id, share_amount, balance) "
            "VALUES (%s, %s, %s, %s)",
            (expense_id, uid, share, balance),
        )
        cursor.execute(
            "INSERT IGNORE INTO user_balance (user_id, group_id, amount) VALUES (%s, %s, 0)",
            (uid, expense.group_id),
        )
        cursor.execute(
            "UPDATE user_balance SET amount = amount + %s "
            "WHERE user_id = %s AND group_id = %s",
            (balance, uid, expense.group_id),
        )

    db.commit()

    return {"expense_id": expense_id, "message": "Expense added successfully"}


# ── Get expenses for a group ──────────────────────────────────────────────────

@app.get("/expenses")
def get_expenses(group_id: int = Query(...), db_dep=Depends(get_db)):
    db, cursor = db_dep

    cursor.execute(
        "SELECT e.expense_id, e.group_id, e.paid_by, e.paid_by_name, "
        "e.amount, e.expense_date, e.description "
        "FROM expenses e "
        "WHERE e.group_id = %s "
        "ORDER BY e.expense_date DESC, e.expense_id DESC",
        (group_id,),
    )
    return [
        {
            "expense_id":   r["expense_id"],
            "group_id":     r["group_id"],
            "paid_by":      r["paid_by"],
            "paid_by_name": r["paid_by_name"],
            "amount":       float(r["amount"]),
            "expense_date": str(r["expense_date"]),
            "description":  r["description"],
        }
        for r in cursor.fetchall()
    ]


# ── Get expense shares ────────────────────────────────────────────────────────

@app.get("/expenses-shares/{expense_id}")
def get_expense_shares(expense_id: int, db_dep=Depends(get_db)):
    db, cursor = db_dep

    cursor.execute(
        "SELECT es.share_id, es.expense_id, es.user_id, u.user_name, "
        "es.share_amount, es.balance "
        "FROM expense_shares es "
        "JOIN users u ON es.user_id = u.user_id "
        "WHERE es.expense_id = %s",
        (expense_id,),
    )
    return [
        {
            "share_id":     r["share_id"],
            "expense_id":   r["expense_id"],
            "user_id":      r["user_id"],
            "user_name":    r["user_name"],
            "share_amount": float(r["share_amount"]),
            "balance":      float(r["balance"]),
        }
        for r in cursor.fetchall()
    ]


# ── Get balances for a group ──────────────────────────────────────────────────

@app.get("/balances")
def get_balances(group_id: int = Query(...), db_dep=Depends(get_db)):
    db, cursor = db_dep

    cursor.execute(
        "SELECT ub.user_id, u.user_name, ub.amount "
        "FROM user_balance ub "
        "JOIN users u ON ub.user_id = u.user_id "
        "WHERE ub.group_id = %s "
        "ORDER BY ub.amount DESC",
        (group_id,),
    )
    return [
        {
            "user_id":   r["user_id"],
            "user_name": r["user_name"],
            "amount":    float(r["amount"]),
        }
        for r in cursor.fetchall()
    ]


# ── Validate invite code ──────────────────────────────────────────────────────

@app.get("/invite/{invite_code}")
def get_invite(invite_code: str, db_dep=Depends(get_db)):
    db, cursor = db_dep

    cursor.execute(
        "SELECT group_id, group_name FROM `groups` WHERE invite_code = %s",
        (invite_code,),
    )
    group = cursor.fetchone()

    if not group:
        raise HTTPException(status_code=404, detail="Invalid invite code")

    return {"group_id": group["group_id"], "group_name": group["group_name"]}


# ── Clear monthly expenses (admin only) — with undo backup ──────────────

@app.post("/groups/{group_id}/clear-expenses")
def clear_monthly_expenses(
    group_id: int,
    admin_id: int = Query(...),
    db_dep=Depends(get_db),
):
    db, cursor = db_dep
    require_admin(group_id, admin_id, cursor)

    # Create backup tables if they don't exist
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS expenses_backup (
            backup_id INT AUTO_INCREMENT PRIMARY KEY,
            group_id INT,
            expense_id INT,
            paid_by INT,
            paid_by_name VARCHAR(100),
            amount DECIMAL(10, 2),
            expense_date DATE,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX(group_id)
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS expense_shares_backup (
            backup_id INT AUTO_INCREMENT PRIMARY KEY,
            group_id INT,
            share_id INT,
            expense_id INT,
            user_id INT,
            share_amount DECIMAL(10, 2),
            balance DECIMAL(10, 2),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX(group_id)
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS balances_backup (
            backup_id INT AUTO_INCREMENT PRIMARY KEY,
            group_id INT,
            user_id INT,
            amount DECIMAL(10, 2),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX(group_id)
        )
    """)
    db.commit()

    # Backup all expenses for this group
    cursor.execute("""
        INSERT INTO expenses_backup (group_id, expense_id, paid_by, paid_by_name, amount, expense_date, description)
        SELECT group_id, expense_id, paid_by, paid_by_name, amount, expense_date, description
        FROM expenses WHERE group_id = %s
    """, (group_id,))

    # Backup all expense shares for this group
    cursor.execute("""
        INSERT INTO expense_shares_backup (group_id, share_id, expense_id, user_id, share_amount, balance)
        SELECT %s, share_id, es.expense_id, user_id, share_amount, balance
        FROM expense_shares es
        JOIN expenses e ON es.expense_id = e.expense_id
        WHERE e.group_id = %s
    """, (group_id, group_id))

    # Backup all balances for this group
    cursor.execute("""
        INSERT INTO balances_backup (group_id, user_id, amount)
        SELECT group_id, user_id, amount FROM user_balance WHERE group_id = %s
    """, (group_id,))

    # Now delete the actual data
    cursor.execute("DELETE FROM expense_shares WHERE expense_id IN (SELECT expense_id FROM expenses WHERE group_id = %s)", (group_id,))
    cursor.execute("DELETE FROM expenses WHERE group_id = %s", (group_id,))
    cursor.execute("UPDATE user_balance SET amount = 0 WHERE group_id = %s", (group_id,))
    db.commit()

    return {
        "message": "All monthly expenses cleared. You have 30 seconds to undo.",
        "can_undo": True
    }


# ── Undo clear monthly expenses ──────────────────────────────────────────

@app.post("/groups/{group_id}/undo-clear")
def undo_clear_expenses(
    group_id: int,
    admin_id: int = Query(...),
    db_dep=Depends(get_db),
):
    db, cursor = db_dep
    require_admin(group_id, admin_id, cursor)

    # Check if backup exists (created within last 30 seconds)
    cursor.execute("""
        SELECT COUNT(*) as cnt FROM expenses_backup 
        WHERE group_id = %s AND created_at > DATE_SUB(NOW(), INTERVAL 30 SECOND)
    """, (group_id,))
    
    if cursor.fetchone()["cnt"] == 0:
        raise HTTPException(status_code=400, detail="Undo window expired (30 seconds). Data cannot be recovered.")

    # Restore expenses
    cursor.execute("""
        INSERT INTO expenses (expense_id, group_id, paid_by, paid_by_name, amount, expense_date, description)
        SELECT expense_id, group_id, paid_by, paid_by_name, amount, expense_date, description
        FROM expenses_backup WHERE group_id = %s
    """, (group_id,))

    # Restore expense shares
    cursor.execute("""
        INSERT INTO expense_shares (share_id, expense_id, user_id, share_amount, balance)
        SELECT share_id, expense_id, user_id, share_amount, balance
        FROM expense_shares_backup WHERE group_id = %s
    """, (group_id,))

    # Restore balances
    cursor.execute("""
        UPDATE user_balance ub
        JOIN balances_backup bb ON ub.group_id = bb.group_id AND ub.user_id = bb.user_id
        SET ub.amount = bb.amount
        WHERE ub.group_id = %s
    """, (group_id,))

    # Clean up backups for this group
    cursor.execute("DELETE FROM expenses_backup WHERE group_id = %s", (group_id,))
    cursor.execute("DELETE FROM expense_shares_backup WHERE group_id = %s", (group_id,))
    cursor.execute("DELETE FROM balances_backup WHERE group_id = %s", (group_id,))
    db.commit()

    return {"message": "✓ Data restored successfully!"}


# ── Health check ──────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok"}