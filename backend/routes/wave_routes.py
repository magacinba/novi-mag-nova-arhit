from fastapi import APIRouter, Depends
from models.wave import StartWaveRequest, WaveUpdateRequest
from services.wave_service import (
    start_wave,
    get_wave,
    update_wave_item,
    get_coordinates,
    wave_debug,
)
from auth import get_current_user
from logs import log_event

router = APIRouter()


@router.post("/wave/start")
def start_wave_route(req: StartWaveRequest, user: dict = Depends(get_current_user)):
    unique_invoices = sorted({item.invoice for item in req.items})
    for inv in unique_invoices:
        log_event("barcode_scan", user["username"], user["role"], {"invoice": inv})
    log_event(
        "excel_import",
        user["username"],
        user["role"],
        {"items_count": len(req.items), "invoices_count": len(unique_invoices)},
    )
    return start_wave(req)


@router.get("/wave/{session_id}")
def get_wave_route(session_id: str, _: dict = Depends(get_current_user)):
    return get_wave(session_id)


@router.post("/wave/{session_id}/update")
def update_wave_route(session_id: str, req: WaveUpdateRequest, _: dict = Depends(get_current_user)):
    return update_wave_item(session_id, req)


@router.get("/warehouse/coordinates")
def get_coordinates_route(_: dict = Depends(get_current_user)):
    return get_coordinates()


@router.get("/wave/__debug")
def wave_debug_route(_: dict = Depends(get_current_user)):
    return wave_debug()
