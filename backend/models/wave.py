from pydantic import BaseModel
from typing import List, Optional

class WaveItem(BaseModel):
    sku: str
    qty: int
    location: str
    invoice: str

class StartWaveRequest(BaseModel):
    items: List[WaveItem]
    mode: str = "optimal"

class WaveUpdateRequest(BaseModel):
    sku: str
    invoice: str
    action: str
    qty_picked: Optional[int] = None
    note: Optional[str] = None
    location: Optional[str] = None  # opciona lokacija za runi unos
