from ai.service import build_llm


def test_build_llm_uses_openrouter_model():
    llm = build_llm("test-key", "inclusionai/ling-3.0-flash-vl:free")

    assert llm.model_name == "inclusionai/ling-3.0-flash-vl:free"
    assert llm.openai_api_base == "https://openrouter.ai/api/v1"
