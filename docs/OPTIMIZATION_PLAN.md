# MOLLEI: Latency Optimization Plan

> **Tier**: 3 — Execution (see [INDEX.md](INDEX.md))
> **Last Updated**: 12-28-25 3:00PM PST
> **Status**: Recommendations Integrated

> **Constants Reference**: All magic values in this document should map to constants defined in
> `lib/utils/constants.ts`. See [IMPLEMENTATION_SCAFFOLD.md §5.2](architecture/IMPLEMENTATION_SCAFFOLD.md#52-configuration--constants)
> for the authoritative constant definitions. When in doubt follow the existing patterns.

**Related**: [ARCHITECTURE_BLUEPRINT.md](ARCHITECTURE_BLUEPRINT.md), [NORTHSTAR.md](NORTHSTAR.md)

---

## Executive Summary

This document analyzes the feasibility of reducing Mollei's response latency from **<5s P95** to **<3s P95** based on comprehensive research of LLM benchmarks, multi-agent optimization techniques, and industry best practices.

**Verdict**: **<3s is achievable** with targeted model substitutions and architectural optimizations.

---

## Part 1: Industry Context

### User Tolerance Thresholds (2024-2025 Research)

| Response Time | User Experience | Conversion Rate | Abandonment Risk |
|---------------|-----------------|-----------------|------------------|
| **<1s** | Instant - "table stakes" in 2024 | 22.8% | Minimal |
| **1-2s** | Optimal for RAG/interactive systems | ~20% | Low |
| **2-3s** | "Just right" zone (Zendesk) | 15.9% | Moderate |
| **3-5s** | Edge of acceptable | ~12% | **Rising** |
| **>5s** | Failure zone | 8.3% | **73% abandon** |

### Key Research Findings

| Finding | Source |
|---------|--------|
| "Even a 2-second delay reduces user satisfaction by 30%" | Baymard Institute 2024 |
| "73% of users abandon chats after 5 seconds" | Forrester Research 2023 |
| "Latency above 1 second increases abandonment by 40%" | WebMD Studies |
| "Moderate response latency + emotional support heightened chatbot evaluations" | 2025 Academic Study |
| "Timing delays of ~1 second are optimal for human-like relatability" | UX Research |

### Emotional Companion Context

For emotional AI companions like Mollei, there's nuance:

- **Some delay mimics human conversational rhythms** - can enhance perceived authenticity
- **Typing indicators significantly reduce perceived wait time**
- **Quality of emotional response can offset latency penalty** - but only marginally
- **Optimal target: 2-3s typical, <5s edge case**

---

## Part 2: Current Architecture Analysis

### Existing Latency Budget

| Phase | Agents | Model | Budget | Parallel? |
|-------|--------|-------|--------|-----------|
| Phase 1 | mood_sensor, memory_agent, safety_monitor | Sonnet, Sonnet, Haiku | 1.5s | Yes (concurrent) |
| Phase 2 | emotion_reasoner | Sonnet | 1.5s | Sequential |
| Phase 3 | response_generator | **Opus** | 3.0s | Sequential |
| **Total** | | | **6.0s** | |

**Current P95 target: <5s** — This is already aggressive and leaves no margin.

### Critical Bottleneck Identification

Research consistently shows: **LLM inference is the primary latency contributor** (not orchestration, not tools, not network).

| Component | Latency Contribution |
|-----------|---------------------|
| LLM inference (`call_model`) | **60-80%** of total |
| Tool/retrieval operations | 10-20% |
| Orchestration overhead | 5-10% |
| Network/serialization | <5% |

The **response_generator using Opus** is the single largest bottleneck.

---

## Part 3: Claude Model Latency Benchmarks

### Comprehensive Model Comparison

| Model | Tokens/sec | TTFT (Time to First Token) | Typical Latency | Use Case |
|-------|------------|----------------------------|-----------------|----------|
| **Claude 3 Haiku** | 78-123 tok/s | 0.4-0.7s | **<1s** | Simple classification |
| **Claude 3.5 Haiku** | 30-65 tok/s | 0.5-0.7s | ~1-2s | Balanced speed/quality |
| **Claude Haiku 4.5** | 4-5x faster than Sonnet 4.5 | <0.5s | **<1s** | Agentic sub-tasks |
| **Claude 3.5 Sonnet** | 38-72 tok/s | 0.6-1.0s | 2-4s | Complex reasoning |
| **Claude Sonnet 4** | 18-31 tok/s | 1.8s | 3-5s | High-quality generation |
| **Claude Sonnet 4.5** | 17-22 tok/s | 2.0s | 3-5s | Frontier quality |
| **Claude Opus** | 16-26 tok/s | 2.0s+ | **5-10s+** | Maximum quality |

### Key Insight: Haiku 4.5

From Anthropic's announcement (October 2025):

> "Claude Haiku 4.5 matches Sonnet 4 on coding, computer use, and agentic workflows at substantially lower cost and faster speeds."

> "Runs up to 4-5 times faster than Sonnet 4.5 at a fraction of the cost."

> "Speed is the new frontier for AI agents operating in feedback loops."

**This makes Haiku 4.5 ideal for Mollei's analysis agents.**

---

## Part 4: Optimization Strategies

### Strategy 1: Replace Opus with Sonnet 4.5 for Response Generation

**Current**: Opus for `response_generator` (3s budget, often exceeds)
**Proposed**: Sonnet 4.5 for `response_generator`

| Metric | Opus | Sonnet 4.5 | Impact |
|--------|------|------------|--------|
| Tokens/sec | 16-26 | 17-22 | Similar |
| TTFT | 2.0s+ | 2.0s | Similar |
| Quality | Frontier | Near-frontier | **5-10% reduction** |
| Typical latency | 5-10s | **3-5s** | **2x faster** |

**Quality Trade-off**: Sonnet 4.5 is still excellent for emotional conversation. The quality difference is marginal for supportive dialogue.

**Recommendation**: ✅ **Adopt for MVP and Phase 1**

---

### Strategy 2: Use Haiku 4.5 for Analysis Agents

**Current**: Sonnet for mood_sensor, emotion_reasoner
**Proposed**: Haiku 4.5 for all analysis agents

| Agent | Current Model | Current Latency | Proposed Model | New Latency |
|-------|---------------|-----------------|----------------|-------------|
| mood_sensor | Sonnet | 1.0s | **Haiku 4.5** | **0.3s** |
| memory_agent | Sonnet | 1.5s | **Haiku 4.5** | **0.5s** |
| emotion_reasoner | Sonnet | 1.5s | **Haiku 4.5** | **0.5s** |
| safety_monitor | Haiku | 0.5s | Haiku 4.5 | 0.3s |

**Quality Trade-off**: Haiku 4.5 matches Sonnet 4 on agentic tasks. For classification and structured output (emotion detection, safety signals), Haiku 4.5 is sufficient.

**Recommendation**: ✅ **Adopt for all analysis agents**

---

### Strategy 3: Implement Streaming Response

**Impact**: Transforms perceived latency from total generation time to TTFT.

| Metric | Without Streaming | With Streaming |
|--------|-------------------|----------------|
| User sees first text | After full generation (3-5s) | **<1s (TTFT)** |
| Perceived responsiveness | Slow | **Instant** |
| Total generation time | Same | Same |

**Implementation**: Already supported by Vercel AI SDK's `streamText()`.

```typescript
// Current (blocking)
const { text } = await generateText({ model, prompt });

// Optimized (streaming)
const { textStream } = await streamText({ model, prompt });
for await (const chunk of textStream) {
  // Send to client immediately
}
```

**Research Support**: "Even a 2-second wait feels shorter than an unresponsive half-second pause" with typing indicators.

**Recommendation**: ✅ **Critical - implement immediately**

---

### Strategy 4: Reduce Token Budgets

**Insight**: Shorter responses are often better for emotional support (less overwhelming).

| Agent | Current Budget | Optimized Budget | Rationale |
|-------|----------------|------------------|-----------|
| response_generator | 2000 tokens | **800 tokens** | Concise emotional responses |
| memory_agent | 1500 tokens | **500 tokens** | Summary only, not full context |
| emotion_reasoner | 1200 tokens | **400 tokens** | Structured output, not prose |
| mood_sensor | 800 tokens | **300 tokens** | Simple classification |

**Latency Impact**: At 50 tok/s, 800 tokens = 16s generation. But with streaming, first token appears in <1s.

**Recommendation**: ⚠️ **Test and validate** - quality impact varies by use case

---

### Strategy 5: Enable Prompt Caching

Anthropic offers prompt caching with:
- **Up to 90% cost savings** on cached portions
- **Significant latency reduction** for repeated system prompts

**Implementation**:

```typescript
import { MODELS } from "@/lib/ai/models";
import { TOKEN_BUDGETS } from "@/lib/utils/constants";

const response = await anthropic.messages.create({
  model: MODELS.SONNET,
  max_tokens: TOKEN_BUDGETS.RESPONSE_GENERATOR,
  system: [
    {
      type: "text",
      text: MOLLEI_SYSTEM_PROMPT, // ~2000 tokens, cached
      cache_control: { type: "ephemeral" }
    }
  ],
  messages: [{ role: "user", content: userMessage }]
});
```

**Recommendation**: ✅ **Adopt for all agents with static system prompts**

---

### Strategy 6: Parallel Execution Optimization

**Current**: mood_sensor, memory_agent, safety_monitor run concurrently (good)
**Opportunity**: Ensure no sequential dependencies block parallel execution

```typescript
import { AGENT_IDS } from "../utils/constants";

// Verify LangGraph parallel execution
workflow.addEdge(START, AGENT_IDS.MOOD_SENSOR);
workflow.addEdge(START, AGENT_IDS.MEMORY_AGENT);
workflow.addEdge(START, AGENT_IDS.SAFETY_MONITOR);

// All three complete before emotion_reasoner
workflow.addEdge(AGENT_IDS.MOOD_SENSOR, AGENT_IDS.EMOTION_REASONER);
workflow.addEdge(AGENT_IDS.MEMORY_AGENT, AGENT_IDS.EMOTION_REASONER);
workflow.addEdge(AGENT_IDS.SAFETY_MONITOR, AGENT_IDS.EMOTION_REASONER);
```

**Recommendation**: ✅ **Already implemented - verify no regressions**

---

## Part 5: Revised Latency Budget

### Optimized Architecture

| Phase | Agents | Model | New Budget | Previous |
|-------|--------|-------|------------|----------|
| Phase 1 | mood_sensor, memory_agent, safety_monitor | **Haiku 4.5** | **0.5s** | 1.5s |
| Phase 2 | emotion_reasoner | **Haiku 4.5** | **0.5s** | 1.5s |
| Phase 3 | response_generator | **Sonnet 4.5** | **1.5s** | 3.0s |
| **Total** | | | **<2.5s** | 6.0s |

### New Latency Targets

| Metric | Current | Proposed | Improvement |
|--------|---------|----------|-------------|
| **P50 (typical)** | Not defined | **<2s** | New metric |
| **P95 (edge case)** | <5s | **<3s** | 40% faster |
| **TTFT (streaming)** | Not defined | **<1s** | New metric |

### With Streaming UX

| User Experience | Timing |
|-----------------|--------|
| User sends message | 0ms |
| Typing indicator appears | 50ms |
| First text token streams | **<1s** |
| Response completes | 2-3s |
| **Perceived latency** | **<1s** |

---

## Part 6: Quality Trade-off Analysis

### Model Substitution Impact

| Change | Quality Impact | Acceptable? |
|--------|----------------|-------------|
| Opus → Sonnet 4.5 (response) | 5-10% reduction in nuance | ✅ Yes - still excellent for emotional support |
| Sonnet → Haiku 4.5 (analysis) | Minimal for structured tasks | ✅ Yes - Haiku 4.5 matches Sonnet 4 on agentic tasks |
| Reduced token budgets | Shorter responses | ⚠️ Test - may actually improve UX |

### Mitigation Strategies

1. **A/B test** Opus vs Sonnet 4.5 responses for user preference
2. **Monitor** emotional accuracy metric (target: 75%+)
3. **Fallback** to Opus for complex emotional situations if quality degrades
4. **Keep Opus** as fallback in circuit breaker chain

### When to Use Opus

Reserve Opus for:
- Complex multi-turn emotional processing
- Crisis response (severity 4+)
- When Sonnet 4.5 fallback is triggered

---

## Part 7: Implementation Roadmap

### Phase 1: Quick Wins (Week 1)

| Task | Impact | Effort |
|------|--------|--------|
| Enable streaming for response_generator | Perceived <1s | Low |
| Add typing indicators to UI | UX improvement | Low |
| Enable prompt caching | 20-30% latency reduction | Low |

### Phase 2: Model Optimization (Week 2)

| Task | Impact | Effort |
|------|--------|--------|
| Switch mood_sensor to Haiku 4.5 | 0.7s saved | Medium |
| Switch emotion_reasoner to Haiku 4.5 | 1.0s saved | Medium |
| A/B test Sonnet 4.5 vs Opus for response | Validate quality | Medium |

### Phase 3: Full Rollout (Week 3)

| Task | Impact | Effort |
|------|--------|--------|
| Switch response_generator to Sonnet 4.5 | 1.5s saved | Medium |
| Reduce token budgets (with validation) | Variable | Medium |
| Update monitoring dashboards | Visibility | Low |

### Phase 4: Validation (Week 4)

| Task | Success Criteria |
|------|------------------|
| Measure P50, P95 latency | P50 <2s, P95 <3s |
| Measure TTFT | <1s |
| Monitor emotional accuracy | Maintain 75%+ |
| User satisfaction survey | No degradation |

---

## Part 8: Feasibility Summary

| Target | Achievable? | Requirements |
|--------|-------------|--------------|
| **<5s P95** (current) | ✅ Yes | Current architecture |
| **<3s P95** | ✅ Yes | Opus → Sonnet 4.5, Haiku 4.5 for agents |
| **<2s P95** | ⚠️ Aggressive | All Haiku 4.5 + token budget cuts + streaming |
| **<1s P95** | ❌ Not feasible | Would require single Haiku call, no orchestration |

---

## Part 9: Monitoring & Alerting

### New Metrics to Track

```typescript
// lib/metrics/latency-tracking.ts

interface LatencyMetrics {
  // Existing
  p95TotalLatency: number;      // Target: <3s

  // New
  p50TotalLatency: number;      // Target: <2s
  ttft: number;                 // Target: <1s
  streamingEnabled: boolean;    // Target: 100%

  // Per-agent breakdown
  agentLatencies: {
    moodSensor: number;         // Target: <0.5s
    memoryAgent: number;        // Target: <0.5s
    safetyMonitor: number;      // Target: <0.3s
    emotionReasoner: number;    // Target: <0.5s
    responseGenerator: number;  // Target: <1.5s
  };
}
```

### Alert Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| P95 Latency | >2.5s | >3.5s |
| P50 Latency | >1.5s | >2.5s |
| TTFT | >0.8s | >1.5s |
| Any agent >2x budget | Warning | - |

---

## Part 10: Decision Log

| Date | Decision | Rationale | Owner |
|------|----------|-----------|-------|
| 2025-12-24 | Target <3s P95 (down from <5s) | Industry benchmarks show 5s is abandonment threshold | Product |
| 2025-12-24 | Switch analysis agents to Haiku 4.5 | Matches Sonnet 4 quality at 4-5x speed | Engineering |
| 2025-12-24 | Evaluate Sonnet 4.5 for response_generator | 2x faster than Opus with minimal quality loss | Engineering |
| 2025-12-24 | Mandate streaming for all responses | Perceived latency <1s critical for UX | Product |
| 2025-12-24 | Add TTFT as primary latency metric | Users judge speed by first token, not completion | Product |

---

## Appendix A: Research Sources

### LLM Latency Benchmarks
- Artificial Analysis: Claude model benchmarks
- LLM Benchmarks: Anthropic provider comparison
- Keywords AI: Claude 3.5 Haiku vs Sonnet analysis

### Multi-Agent Optimization
- LangChain Blog: "How do I speed up my agent?"
- Galileo AI: LangGraph multi-agent system evaluation
- AWS: Multi-agent system with LangGraph and Mistral

### User Experience Research
- Forrester Research: Chatbot abandonment rates
- Baymard Institute: Delay impact on satisfaction
- Zendesk: Customer experience benchmarks 2024
- Academic: "Effects of response time on chatbot evaluations" (2025)

### Anthropic Documentation
- Claude Haiku 4.5 announcement
- Prompt caching documentation
- Model comparison benchmarks

---

## Appendix B: Glossary

| Term | Definition |
|------|------------|
| **TTFT** | Time to First Token - latency before streaming begins |
| **P50** | 50th percentile (median) latency |
| **P95** | 95th percentile latency - edge case performance |
| **Streaming** | Sending response tokens as generated, not waiting for completion |
| **Prompt Caching** | Anthropic feature to cache and reuse system prompt processing |

---

**Document Status**: Strategic Recommendation
**Next Review**: After Phase 4 validation
**Related Documents**:
- [ARCHITECTURE_BLUEPRINT.md](ARCHITECTURE_BLUEPRINT.md) - Technical architecture
- [NORTHSTAR.md](NORTHSTAR.md) - Strategic specification

---

*This optimization plan should be reviewed after implementation to validate assumptions and refine targets based on production data.*

---

© 2025 Patrick Peña / Agenisea™

All original text and documentation is © the author.
Documentation is licensed for use, sharing, and adaptation under the same terms as this repository, unless otherwise noted.
