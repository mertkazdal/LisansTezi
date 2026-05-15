# Gemini SDK Migration Plan

The AI service currently uses `google-generativeai==0.8.0`. It is kept in place for now because the existing text emotion, conflict resolution, personality, avatar, and recommendation code already uses that client shape.

Safe migration path:

1. Add `google-genai` beside the current SDK in a branch.
2. Wrap Gemini calls behind one internal adapter in `ai-service/services/gemini_service.py`.
3. Port one flow at a time: text emotion, conflict resolution, recommendation queries, personality, avatar.
4. Run Docker verification after each flow:
   - `python -m compileall ai-service`
   - `/analyze` text-only
   - `/analyze` image + text conflict
   - `/recommendations`
   - `/personality/detect`
5. Remove `google-generativeai` only after all flows pass.

Do not mix old and new response parsing inside business logic. Keep provider-specific parsing isolated in the adapter so recommendation and analysis code stays stable.
