"""add_pad_fields_to_docentes

Revision ID: 600472ece776
Revises: f6712b29efa7
Create Date: 2026-07-15 16:45:38.965085

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '600472ece776'
down_revision: Union[str, Sequence[str], None] = 'f6712b29efa7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Agregar campos de información docente para el reporte PAD."""
    op.add_column('docentes', sa.Column('rfc', sa.String(length=13), nullable=True))
    op.add_column('docentes', sa.Column('curp', sa.String(length=18), nullable=True))
    op.add_column('docentes', sa.Column('fecha_ingreso', sa.Date(), nullable=True))
    op.add_column('docentes', sa.Column('perfil_academico', sa.String(length=200), nullable=True))
    op.add_column('docentes', sa.Column('ultimo_grado_estudio', sa.String(length=150), nullable=True))


def downgrade() -> None:
    """Revertir campos PAD del docente."""
    op.drop_column('docentes', 'ultimo_grado_estudio')
    op.drop_column('docentes', 'perfil_academico')
    op.drop_column('docentes', 'fecha_ingreso')
    op.drop_column('docentes', 'curp')
    op.drop_column('docentes', 'rfc')
