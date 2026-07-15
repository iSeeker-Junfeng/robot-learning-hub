from app.knowledge import KnowledgeBase


def test_current_chapter_is_ranked_first():
    knowledge = KnowledgeBase()
    results = knowledge.search("QoS 应该怎么选择", "ros2-qos")
    assert results[0]["id"] == "ros2-qos"


def test_sources_do_not_expose_full_content():
    knowledge = KnowledgeBase()
    sources = knowledge.sources(knowledge.search("四元数", "kin-rotation"))
    assert sources[0]["title"]
    assert "materials" not in sources[0]
