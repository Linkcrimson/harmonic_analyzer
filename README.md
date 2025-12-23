# Harmonic Analyzer

A powerful, cross-platform web-based tool for real-time musical chord analysis and harmonic exploration, designed for a seamless experience on both **Desktop** and **Mobile** devices.

## Live Demo

Try it out here: [Harmonic Analyzer](https://linkcrimson.github.io/harmonic_analyzer/)

## Features

- **Real-time Chord Analysis**: Advanced detection of chords with intelligent weighting and "Avoid Notes" logic to prioritize musically sound interpretations.
- **Multilingual Support**: Available in **English** and **Italian**.
- **MIDI Keyboard Support**: Connect your MIDI devices for seamless input.
- **Advanced Sustain Pedal Logic**: Full support for sustain pedal (CC 64) for a natural playing experience.
- **Accessibility First**: Built with WCAG standards in mind, including ARIA roles, full keyboard navigation, and octave announcements for screen readers.
- **PWA Ready**: Install the application on your smartphone or desktop for offline access and a native-like experience.
- **Visual Piano Interface**: High-end, responsive piano display.
- **Micro-Minimap (Mobile)**: A specialized minimap for smartphones to help navigate the keyboard with harmonic color coding.
- **Didactic Tooltips**: Basic educational tooltips (English/Italian) providing insights into harmonic functions and intervals.

## Development

To run this project locally:

1.  **Clone the repository**
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Start the development server**:
    ```bash
    npm run dev
    ```

## Technical Stack

- **Framework**: [React 19](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **PWA**: `vite-plugin-pwa`
- **Testing**: [Vitest](https://vitest.dev/) & [Playwright](https://playwright.dev/)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
