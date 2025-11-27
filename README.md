# Verdant

![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![Gemini](https://img.shields.io/badge/Google%20Gemini-8E75B2?style=for-the-badge&logo=google&logoColor=white)

> **"The quiet encyclopedia of everything alive."**

Verdant is a nature-focused knowledge engine that blends the poetic power of Generative AI with hard scientific data. It provides a sanctuary from the noisy internet, offering a serene, ad-free environment to explore the biological world.

## ✨ Features

### 🧠 **AI-Powered Synthesis**
*   **Gemini 3.0 Pro Integration**: Generates detailed, structured encyclopedia entries on the fly.
*   **Poetic Narratives**: Transforms raw data into engaging "nature writing" rather than dry facts.
*   **Intelligent Search**: Understands natural language queries and suggests corrections.

### 🌍 **Grounded in Reality**
*   **GBIF Integration**: Fetches real-world occurrence data to show where species are actually found.
*   **Live Habitat Conditions**: Uses **Open-Meteo** to display current weather conditions (temperature, day/night cycle) at the species' last observed location.
*   **Citizen Science**: Aggregates community photos from **iNaturalist** and **GBIF**.

### 🎨 **Immersive Media**
*   **Dynamic Imagery**: Uses AI generation for specific visuals or falls back to high-quality Wikipedia/iNaturalist photography.
*   **Audio Landscapes**: Automatically fetches and plays bird calls and animal sounds via the **Xeno-canto** API.

### 👤 **User Features**
*   **Personal Collection**: Save your favorite species to a persistent library (powered by **Supabase**).
*   **Search History**: Keep track of your exploration journey.
*   **Secure Auth**: Email/Password authentication flow.

### 🛠 **Tech Stack**
*   **Frontend**: React, TypeScript, Tailwind CSS
*   **AI**: Google Gemini API (@google/genai)
*   **Backend/DB**: Supabase (PostgreSQL + Auth)
*   **Data APIs**: GBIF, iNaturalist, Open-Meteo, Xeno-canto, Wikipedia
*   **Hosting**: Vercel

## 🚀 Getting Started

1.  Clone the repository.
2.  Install dependencies: `npm install`
3.  Set up environment variables in `.env`:
    *   `API_KEY` (Google Gemini)
    *   `VITE_SUPABASE_URL`
    *   `VITE_SUPABASE_ANON_KEY`
4.  Run locally: `npm run dev`

## 📄 License

This project is licensed under the Apache 2.0 License.