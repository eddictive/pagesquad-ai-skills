# Tailwind CSS & UI Component Patterns

Efficient styling using utility classes and pre-built UI components.

## Tailwind Best Practices

- **Responsiveness**: Use `sm:`, `md:`, `lg:` prefixes for all layout changes.
- **Containerization**: Use `container mx-auto px-4` to center content.
- **Typography**: Define a clear hierarchy using `text-4xl`, `font-bold`, `leading-tight`.
- **Colors**: Use the project's primary color palette for brand consistency.

## DaisyUI Integration

DaisyUI adds semantic class names (e.g., `btn`, `card`, `modal`) to Tailwind.
- **Buttons**: `btn btn-primary`, `btn-outline`, `btn-lg`.
- **Cards**: `card bg-base-100 shadow-xl`.
- **Forms**: `input input-bordered`, `textarea`.

## Shadcn UI Patterns

Shadcn provides accessible, unstyled components that you copy into your project.
- **Installation**: Use `bunx shadcn-ui@latest add [component]`.
- **Customization**: Edit the `ui/` directory directly to match the brand.
- **Forms**: Combine with `react-hook-form` and `zod` for robust validation.

## Section Templates (Tailwind-Ready)

### Hero Section
- High-contrast headline.
- Clear primary and secondary buttons.
- Full-screen or large image/background.

### Feature Grid
- Responsive `grid grid-cols-1 md:grid-cols-3 gap-8`.
- Icons + Headline + Short Description.
