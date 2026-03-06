"""
Test AgentArmyAssistant v1.0 - The Ultimate Autonomous Marketing & Sales Army
"""
import pytest
import asyncio
from datetime import datetime

# Import from the tools module
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from core.tools.assistant import (
    AgentArmyAssistant,
    AssistantConfig,
    EmailConfig,
    SocialConfig,
    ReplyImportance,
    SocialPlatform,
    InvestorType,
    EmailReply,
    ReplyAssessment,
    CoFounderCandidate,
    Investor,
    Post,
    create_assistant
)


class TestAgentArmyAssistant:
    """Test all capabilities of AgentArmyAssistant"""
    
    @pytest.fixture
    def config(self):
        """Create test configuration"""
        return AssistantConfig(
            max_posts_per_day=100,
            max_comments_per_day=500,
            recursion_depth=3,
            search_regions=["USA", "Canada"],
            target_skills=["Python", "JavaScript"]
        )
    
    @pytest.fixture
    def assistant(self, config):
        """Create assistant instance"""
        return AgentArmyAssistant(config)
    
    # =========================================================================
    # INITIALIZATION TESTS
    # =========================================================================
    
    def test_assistant_initialization(self, assistant):
        """Test assistant initializes correctly"""
        assert assistant is not None
        assert assistant.mode.value == "full_stack"
        assert assistant.config.max_posts_per_day == 100
        assert assistant.config.recursion_depth == 3
    
    def test_create_assistant_factory(self):
        """Test factory function"""
        assistant = create_assistant(max_posts_per_day=50)
        assert assistant.config.max_posts_per_day == 50
    
    def test_get_status(self, assistant):
        """Test status retrieval"""
        status = assistant.get_status()
        assert status["mode"] == "full_stack"
        assert "components" in status
        assert status["components"]["cofounder_hunter"] is True
        assert status["components"]["sales_coach"] is True
    
    # =========================================================================
    # EMAIL TESTS
    # =========================================================================
    
    @pytest.mark.asyncio
    async def test_send_email_without_config(self, assistant):
        """Test email send without config"""
        result = await assistant.send_email("test@example.com", "Test", "Body")
        assert result is False  # No email config
    
    @pytest.mark.asyncio
    async def test_check_replies_without_config(self, assistant):
        """Test reply checking without config"""
        result = await assistant.check_replies()
        assert result == []
    
    # =========================================================================
    # CO-FOUNDER HUNTER TESTS
    # =========================================================================
    
    @pytest.mark.asyncio
    async def test_hunt_cofounders(self, assistant):
        """Test co-founder search"""
        criteria = {
            "regions": ["USA", "Canada"],
            "skills": ["Python", "React"]
        }
        candidates = await assistant.hunt_cofounders(criteria)
        
        assert len(candidates) > 0
        assert all(isinstance(c, CoFounderCandidate) for c in candidates)
        
        # Check first candidate has required fields
        first = candidates[0]
        assert first.name
        assert first.email
        assert first.skills
        assert first.match_score > 0
    
    # =========================================================================
    # SALES COACH TESTS
    # =========================================================================
    
    @pytest.mark.asyncio
    async def test_coach_analyze(self, assistant):
        """Test sales coach analysis"""
        results = {
            "sent": 100,
            "replies": 10,
            "meetings": 3
        }
        analysis = await assistant.coach_analyze(results)
        
        assert "conversion_rate" in analysis
        assert analysis["conversion_rate"] == 0.1
        assert "recommendations" in analysis
    
    @pytest.mark.asyncio
    async def test_coach_generate_strategy(self, assistant):
        """Test strategy generation"""
        strategy = await assistant.coach_generate_strategy(
            goal="Raise seed round",
            target_audience="VC investors"
        )
        
        assert strategy["goal"] == "Raise seed round"
        assert "channels" in strategy
        assert "message_templates" in strategy
        assert "email" in strategy["channels"]
    
    @pytest.mark.asyncio
    async def test_coach_refine(self, assistant):
        """Test approach refinement"""
        results = {"low_response": True}
        refinement = await assistant.coach_refine(results)
        
        assert "insights" in refinement
        assert "messages_to_test" in refinement
    
    # =========================================================================
    # PITCH DECK TESTS
    # =========================================================================
    
    @pytest.mark.asyncio
    async def test_generate_pitch_deck(self, assistant):
        """Test pitch deck generation"""
        company_info = {
            "name": "TestStartup",
            "problem": "Big problem in market",
            "solution": "AI-powered solution",
            "market": "$10B opportunity",
            "traction": "$100K ARR",
            "team": "2 founders",
            "ask": "$1M seed"
        }
        
        deck = await assistant.generate_pitch_deck(company_info)
        
        assert "slides" in deck
        assert len(deck["slides"]) > 0
        assert deck["format"] == "pptx"
    
    # =========================================================================
    # VIDEO SHORTS TESTS
    # =========================================================================
    
    @pytest.mark.asyncio
    async def test_generate_video_short(self, assistant):
        """Test video short generation"""
        short = await assistant.generate_video_short(
            topic="AI Startup Revolution",
            platform="tiktok"
        )
        
        assert "script" in short
        assert "caption" in short
        assert "hashtags" in short
        assert short["platform"] == "tiktok"
        assert short["duration"] == 30
    
    # =========================================================================
    # SOCIAL MEDIA TESTS
    # =========================================================================
    
    @pytest.mark.asyncio
    async def test_post_social(self, assistant):
        """Test single social post"""
        post = await assistant.post_social(
            platform="twitter",
            content="Hello from AgentArmy!"
        )
        
        assert post.platform.value == "twitter"
        assert post.content == "Hello from AgentArmy!"
        assert post.posted is True
    
    @pytest.mark.asyncio
    async def test_mass_post(self, assistant):
        """Test mass posting"""
        contents = [
            "Post 1 about AI",
            "Post 2 about startups",
            "Post 3 about funding"
        ]
        
        posts = await assistant.mass_post("twitter", contents)
        
        assert len(posts) == 3
        assert all(p.posted for p in posts)
    
    # =========================================================================
    # INVESTOR FINDER TESTS
    # =========================================================================
    
    @pytest.mark.asyncio
    async def test_find_investors(self, assistant):
        """Test investor finding"""
        criteria = {
            "stage": "seed",
            "check_size": 500000
        }
        
        investors = await assistant.find_investors(criteria)
        
        assert len(investors) > 0
        assert all(isinstance(i, Investor) for i in investors)
        
        first = investors[0]
        assert first.name
        assert first.firm
        assert first.type in InvestorType
    
    @pytest.mark.asyncio
    async def test_generate_investor_outreach(self, assistant):
        """Test investor outreach generation"""
        startup_info = {
            "name": "TestStartup",
            "market": "B2B SaaS",
            "traction": "Growing fast",
            "ask": "$1M seed"
        }
        
        outreach = await assistant.generate_investor_outreach(startup_info)
        
        assert "total_investors" in outreach
        assert "outreach_list" in outreach
        assert len(outreach["outreach_list"]) > 0
        
        first = outreach["outreach_list"][0]
        assert "personalized_pitch" in first
        assert "match_score" in first
    
    # =========================================================================
    # UNIFIED API TESTS
    # =========================================================================
    
    @pytest.mark.asyncio
    async def test_process_cofounder_request(self, assistant):
        """Test unified process with co-founder request"""
        request = {
            "cofounder": True,
            "criteria": {"skills": ["Python"]}
        }
        
        result = await assistant.process(request)
        
        assert result.success is True
        assert result.mode == "cofounder_hunt"
        assert result.metrics["candidates_found"] > 0
    
    @pytest.mark.asyncio
    async def test_process_pitch_request(self, assistant):
        """Test unified process with pitch request"""
        request = {
            "pitch_deck": True,
            "company_info": {"name": "Test"}
        }
        
        result = await assistant.process(request)
        
        assert result.success is True
        assert result.mode == "pitch_deck"
    
    @pytest.mark.asyncio
    async def test_process_video_request(self, assistant):
        """Test unified process with video request"""
        request = {
            "video": True,
            "topic": "AI Revolution",
            "platform": "tiktok"
        }
        
        result = await assistant.process(request)
        
        assert result.success is True
        assert result.mode == "video_shorts"
    
    @pytest.mark.asyncio
    async def test_process_social_request(self, assistant):
        """Test unified process with social request"""
        request = {
            "social": True,
            "platform": "twitter",
            "content": "Hello World"
        }
        
        result = await assistant.process(request)
        
        assert result.success is True
        assert result.mode == "social_media"
    
    @pytest.mark.asyncio
    async def test_process_investor_request(self, assistant):
        """Test unified process with investor request"""
        request = {
            "investor": True,
            "startup_info": {"name": "Test"}
        }
        
        result = await assistant.process(request)
        
        assert result.success is True
        assert result.mode == "investor_finder"
    
    @pytest.mark.asyncio
    async def test_process_unknown_request(self, assistant):
        """Test unified process with unknown request"""
        request = {"unknown_key": True}
        
        result = await assistant.process(request)
        
        assert result.success is False
        assert result.mode == "unknown"


# =========================================================================
# DATA CLASS TESTS
# =========================================================================

def test_email_reply_dataclass():
    """Test EmailReply dataclass"""
    reply = EmailReply(
        message_id="123",
        from_email="test@example.com",
        from_name="Test User",
        subject="Test Subject",
        body="Test body",
        received_at=datetime.now()
    )
    
    assert reply.from_email == "test@example.com"
    assert reply.from_name == "Test User"


def test_reply_assessment_dataclass():
    """Test ReplyAssessment dataclass"""
    reply = EmailReply(
        message_id="123",
        from_email="test@example.com", 
        from_name="Test",
        subject="Hi",
        body="Hello",
        received_at=datetime.now()
    )
    
    assessment = ReplyAssessment(
        reply=reply,
        importance=ReplyImportance.HIGH,
        sentiment_score=0.8,
        intent="investment_inquiry",
        is_qualified=True
    )
    
    assert assessment.importance == ReplyImportance.HIGH
    assert assessment.is_qualified is True


def test_cofounder_candidate_dataclass():
    """Test CoFounderCandidate dataclass"""
    candidate = CoFounderCandidate(
        name="John Doe",
        email="john@example.com",
        location="San Francisco",
        skills=["Python", "React"],
        experience_years=5,
        background="Ex-Google",
        match_score=0.9
    )
    
    assert candidate.name == "John Doe"
    assert candidate.match_score == 0.9


def test_investor_dataclass():
    """Test Investor dataclass"""
    investor = Investor(
        name="Jane Investor",
        firm="VC Firm",
        type=InvestorType.VC,
        stage_preferences=["seed", "series_a"],
        check_size_min=100000,
        check_size_max=1000000,
        portfolio_companies=["Company A", "Company B"],
        match_score=0.85
    )
    
    assert investor.type == InvestorType.VC
    assert investor.match_score == 0.85


def test_post_dataclass():
    """Test Post dataclass"""
    post = Post(
        platform=SocialPlatform.TWITTER,
        content="Hello Twitter!",
        hashtags=["#AI", "#Startup"],
        posted=True,
        post_id="12345"
    )
    
    assert post.platform == SocialPlatform.TWITTER
    assert post.posted is True


# =========================================================================
# ENUM TESTS
# =========================================================================

def test_reply_importance_enum():
    """Test ReplyImportance enum"""
    assert ReplyImportance.CRITICAL.value == "critical"
    assert ReplyImportance.HIGH.value == "high"
    assert ReplyImportance.MEDIUM.value == "medium"


def test_social_platform_enum():
    """Test SocialPlatform enum"""
    assert SocialPlatform.TWITTER.value == "twitter"
    assert SocialPlatform.FACEBOOK.value == "facebook"
    assert SocialPlatform.TIKTOK.value == "tiktok"


def test_investor_type_enum():
    """Test InvestorType enum"""
    assert InvestorType.VC.value == "vc"
    assert InvestorType.ANGEL.value == "angel"
    assert InvestorType.ACCELERATOR.value == "accelerator"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
