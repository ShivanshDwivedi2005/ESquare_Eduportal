from pathlib import Path
from alembic import op

revision="202609100001"
down_revision=None
branch_labels=None
depends_on=None

def upgrade()->None:
    root=Path(__file__).resolve().parents[1]/"sql"
    connection=op.get_bind()
    for name in ("foundation.sql","invitation_claim_rls.sql","google_identity.sql"):
        connection.exec_driver_sql((root/name).read_text(encoding="utf-8"))

def downgrade()->None:
    raise RuntimeError("The security baseline is intentionally irreversible")
