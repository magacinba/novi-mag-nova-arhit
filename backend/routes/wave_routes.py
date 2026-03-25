from fastapi import APIRouter
from models.wave import StartWaveRequest, WaveUpdateRequest
from services.wave_service import (
    start_wave,
    get_wave,
    update_wave_item,
    get_coordinates,
    wave_debug,
)

router = APIRouter()

@router.post("/wave/start")
def start_wave_route(req: StartWaveRequest):
    return start_wave(req)

@router.get("/wave/{session_id}")
def get_wave_route(session_id: str):
    return get_wave(session_id)

@router.post("/wave/{session_id}/update")
def update_wave_route(session_id: str, req: WaveUpdateRequest):
    return update_wave_item(session_id, req)

@router.get("/warehouse/coordinates")
def get_coordinates_route():
    return get_coordinates()

@router.get("/wave/__debug")
def wave_debug_route():
    return wave_debug()
