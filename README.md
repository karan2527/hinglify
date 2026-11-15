
# Hinglo

Hinglo is a Chrome Extension that converts English webpage content into Hinglish (Hindi written in Roman script), making web content easier to understand.

## Features

- Convert English webpage content into Hinglish.
- Enable or disable translation with a simple toggle.
- Restore original webpage content anytime.
- Lightweight and easy to use.

## Installation and Setup

### 1. Clone the Repository

Open your terminal and run:

```bash
git clone https://github.com/USERNAME/REPOSITORY.git
```

### 2. Open the Project Folder

```bash
cd REPOSITORY
```

### 3. Open Chrome Extensions

Navigate to:

```text
chrome://extensions/
```

### 4. Enable Developer Mode

Turn ON the **Developer mode** toggle in the top-right corner.

### 5. Load the Extension

- Click **Load unpacked**.
- Select the cloned Hinglo project folder.
- Make sure the selected folder contains `manifest.json`.

### 6. Start Using Hinglo

- Pin Hinglo to your Chrome toolbar.
- Open any webpage.
- Click the Hinglo extension icon.
- Turn ON the translation toggle.
- Supported English text will be converted into Hinglish.

## Project Structure

```text
Hinglo/
├── manifest.json
├── popup.html
├── popup.css
├── popup.js
├── background.js
├── content.js
└── README.md
```

## API

Hinglo uses the [EnglishToHinglish API](https://englishtohinglish.com/free-api) for translation.

## Contributing

Contributions and suggestions are welcome. Feel free to fork the repository and submit a pull request.
