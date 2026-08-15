# 1. Problem Statement

## What are we building?

We are building a hosted voice-based digital twin that lets a visitor talk to an AI representation of the candidate.

The visitor speaks a question such as:

> "Tell me about your backend experience."

The system retrieves relevant information from the candidate's verified sources, generates an answer from that information, speaks the answer back through LiveKit, and shows the sources used for the answer in the UI.

## Core requirements

1. The user must be able to have a real-time voice conversation.
2. LiveKit is the real-time voice layer.
3. The bot must answer questions about the candidate.
4. Answers must be grounded in source material such as the resume and project documents.
5. Every factual answer must expose the source(s) used to generate it.
6. If the knowledge base does not contain the answer, the bot should say that it does not have verified information rather than inventing an answer.
7. The application must be hosted and usable through a browser.
8. The UX should make the voice interaction and citations easy to understand.

## What the project is not

This is not a generic chatbot and it is not a model-training project.

We are not fine-tuning a model to become the candidate. We are building a retrieval-grounded voice agent whose knowledge comes from the candidate's source documents.

## High-level flow

User speech
→ LiveKit
→ TypeScript voice agent
→ retrieve relevant knowledge
→ LLM
→ answer + source references
→ text-to-speech
→ LiveKit
→ user hears the answer

The web UI also displays the answer and its citations.
