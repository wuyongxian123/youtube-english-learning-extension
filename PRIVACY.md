# Privacy

## Audio fix edition 1.3.1

The `tts` permission enables Chrome's extension speech API. Local voices are preferred within the requested accent; network voices, when used, send the selected text to that browser voice service. Dictionary recording requests remain unchanged.

A dedicated extension window requests microphone permission, separately from YouTube's website permission. The permission check obtains an audio stream and immediately stops all tracks. It does not save, transcribe or transmit an audio recording. Actual speech recognition starts on a subsequent Voice input click in the panel and may use Chrome's online speech service.

## Personal learning edition, September 27, 2026

The local 1.3.0 edition adds these data flows:

- Selected text and nearby learning context go to the configured DeepSeek service for simple English explanations, examples and reference IPA.
- Single-word lookups also send the word, without keys or transcript context, to Free Dictionary API at api.dictionaryapi.dev. Playing recordings may contact api.dictionaryapi.dev or ssl.gstatic.com. Missing recordings use an available matching browser/system voice. AI IPA is labeled approximate.
- Ask AI sends the submitted question, learning context and up to twelve prior conversation turns to the configured AI service. Chat history stays in panel memory until the panel closes. Closing a drawer does not cancel a submitted AI request.
- Voice input starts only on a microphone click. The browser speech recognition service may process audio online. The extension does not store recordings. Recognized text is editable before saving or sending.
- Personal notes, their context and input drafts are stored locally. Typing and saving a personal note does not call AI. Old notes are no longer discarded after the first 100; storage failures are reported.
- English captions with very little punctuation automatically use the configured AI service for sentence boundaries. A manual button can retry. Caption words are sent in numbered batches and never rewritten; results are cached locally. This consumes AI credits.

The original project's data flow and provider information follows.

Effective: July 28, 2026

YouTube Learn is a GitHub-only, bring-your-own-key Chrome extension. It has no YouTube Learn account, developer-operated backend, analytics, advertising, or telemetry.

## Data the extension handles

Depending on the feature you use, YouTube Learn handles:

- the canonical URL and video ID of the active YouTube video;
- transcript text and timestamps;
- video metadata such as title, channel, description, and duration;
- text you select in the transcript and nearby transcript context;
- transcript context around a timestamped note;
- content you ask to translate;
- notes you save;
- Supadata and DeepSeek configuration, including API keys; and
- cached transcript, digest, and translation results.

## Where data goes

### Supadata

YouTube Learn sends the canonical YouTube video URL to `https://api.supadata.ai` with your Supadata API key. Supadata returns the transcript and timestamps. A Supadata key is required for transcript retrieval.

### DeepSeek

The published version sends AI feature content to DeepSeek V4 Flash at `https://api.deepseek.com`:

- transcript plus relevant title, channel, description, or duration for an overview;
- selected text plus nearby transcript context for an explanation;
- small semantic transcript batches currently needed for progressive Chinese
  translation, or requested overview or explanation content;
- nearby transcript context and video metadata when polishing a saved note.

The endpoint and `deepseek-v4-flash` model are fixed in the published Settings page. You provide one DeepSeek API key. To use another provider or model, you must adapt your own local source copy and its permissions. The Settings page provides a coding-agent prompt for that purpose and warns you never to include an API key in the prompt or chat.

Requests go directly from the extension to Supadata or DeepSeek. They are authenticated with the keys you supply. YouTube Learn's developer does not proxy or receive these requests.

Those services process data under their own terms, privacy policies, retention practices, and account settings. Do not send confidential, personal, or regulated content unless their terms and your obligations permit it.

## Local storage and retention

YouTube Learn uses Chrome's local extension storage, not a YouTube Learn cloud service.

- Supadata and DeepSeek settings and API keys remain on the device in Chrome's extension storage.
- Saved notes remain until you delete them or remove/clear the extension's data. Notes are limited by available browser storage.
- Recent transcript, digest, and per-segment translation cache entries are stored
  locally. The cache is limited to 20 videos, and entries older than 30 days are
  removed when the side panel opens.

Chrome extension storage is not a password vault. Anyone with sufficient access to your browser profile or device may be able to recover locally stored keys or content. Use scoped keys where providers support them, set spending limits, and rotate or revoke a key if the device or browser profile is compromised.

To remove data:

- delete individual saved notes in YouTube Learn;
- use the Options page to clear cached digests, delete all notes, or reset all extension data;
- remove the extension or clear its stored data from Chrome to delete all local settings, keys, notes, and cache entries; and
- revoke keys in the Supadata or DeepSeek dashboard to stop their future use.

Clearing local data does not delete information already processed or retained by Supadata or DeepSeek. Use each service's controls for service-side requests.

## Permissions

YouTube Learn uses Chrome permissions for these purposes:

- `sidePanel`: display the YouTube Learn interface beside YouTube.
- `storage`: store settings, keys, notes, and cached results locally.
- `tabs`: identify and interact with the active YouTube tab.
- `scripting`: coordinate the extension's YouTube page controls.
- YouTube host access: read the active video's URL and metadata and provide timestamp controls.
- Supadata host access: retrieve transcripts.
- DeepSeek host access: provide AI overviews, explanations, translation, and note polishing through DeepSeek V4 Flash.

YouTube Learn does not use these permissions to monitor general browsing activity.

## No sale or advertising use

YouTube Learn does not sell personal information, build advertising profiles, or share data with data brokers. It does not include analytics SDKs.

## Changes

Privacy-relevant changes will be documented in this file and in the repository history. Review updates before installing a new version.

## Questions

The personal learning version stores up to 150 selected-text/context explanation pairs locally in Chrome storage to speed up repeated lookups. Bilingual mode sends the selected text and English explanation to your configured AI provider for Chinese translation. Opening Ask AI starts an independent conversation; follow-up history is kept only within that open conversation. Saved notes show IPA; dictionary lookups may be used to obtain missing IPA.

This repository does not provide a public support or issue channel. Review this policy, the source code, and each provider's documentation before using the extension. For a vulnerability or accidental secret exposure, follow the private process in [SECURITY.md](SECURITY.md).

## Ask AI saved-note access
Auto mode sends relevant saved-note entries to DeepSeek when the question mentions notes or vocabulary. Manual scopes include this video, all notes and recent 10/20/30/50 words; access can be disabled. Entries include selected words, note text and source context. All-notes context is limited to 100 entries and 24,000 serialized characters; individual fields are also bounded. Chinese answer translation sends the answer to DeepSeek on demand. No web search is performed.
