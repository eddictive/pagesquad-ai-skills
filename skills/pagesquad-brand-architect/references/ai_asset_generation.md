# AI Asset Generation Guide

Optimizing AI models to create high-quality, on-brand visual assets.

## 1. Imagery (Hero & Sections)
- **Style Control**: Define the style (e.g., "Photorealistic", "Cinematic Lighting", "High-End Architectural Photography").
- **Subject Matter**: Be specific about the scene, mood, and subjects.
    - *Prompt Pattern*: `[Subject] in [Setting], [Lighting], [Composition], [Style Keywords]`
- **Avoid Hallucinations**: Prompt for "no text," "clear backgrounds," and "correct anatomy."
- **Authenticity**: Include keywords like "authentic," "natural skin texture," and "candid" to avoid "AI plastic" looks.

## 2. Icons & UI Elements
- **Consistency**: Specify a uniform style (e.g., "Flat minimalist vector line art").
- **Backgrounds**: Always prompt for "isolated on white background" or "transparent background" for easy integration.
- **Complexity**: Request "simple shapes" and "clean lines" for UI scalability.

## 3. Patterns & Textures
- **Seamless Tiling**: Use the `seamless` or `tileable` keyword.
- **Subtlety**: Prompt for "low contrast," "subtle texture," and "monochromatic" to ensure they don't distract from the content.
- **Themes**: Geometric, organic, or industry-specific (e.g., "Subtle geometric pattern").

## 4. Prompt Engineering for Brand Consistency
- **Negative Prompts**: Use to exclude unwanted styles (e.g., "cartoon, 3D render, blurry, messy").
- **Lighting & Color**: Explicitly mention the brand color palette (e.g., "Lighting should have gold and emerald green tones").
- **Mood Keywords**: "Serene," "Luxurious," "Trustworthy," "Spiritual."

## 5. Post-Processing & Integration
- **Upscaling**: Use AI upscalers to ensure assets are high-resolution (4K).
- **Format Conversion**: Convert to `WebP` or `AVIF` for web performance.
- **Color Correction**: Ensure the generated colors match the brand's hexadecimal codes exactly.
