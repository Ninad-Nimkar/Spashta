// Wrap everything in an IIFE (Immediately Invoked Function Expression)
// This keeps all our variables private — nothing leaks to the global scope
(() => {
    'use strict';

    // 🔧 Backend URL for the Android App
    const API_BASE_URL = "https://spashta.azurewebsites.net";

    // ── DOM refs ──────────────────────────────────────
    // Grab every element we need from the HTML upfront
    const textInput       = document.getElementById('text-input');
    const btnGenerate     = document.getElementById('btn-generate');
    const btnLoader       = document.getElementById('btn-loader');
    const outputSection   = document.getElementById('output-section');
    const playBtn         = document.getElementById('play-btn');
    const iconPlay        = document.getElementById('icon-play');
    const iconPause       = document.getElementById('icon-pause');
    const progressBar     = document.getElementById('progress-bar');
    const progress        = document.getElementById('progress');
    const thumb           = document.getElementById('thumb');
    const currentTimeEl   = document.getElementById('current-time');
    const durationEl      = document.getElementById('duration');
    const audioElement    = document.getElementById('audio-element');
    const transcriptBody  = document.getElementById('transcript-body');
    const dropdownLanguage = document.getElementById('dropdown-language');
    const dropdownStyle   = document.getElementById('dropdown-style');


    // ── Helpers ───────────────────────────────────────

    // Converts seconds into m:ss format for the audio player
    function formatTime(s) {
        if (isNaN(s) || !isFinite(s)) return '0:00';
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60).toString().padStart(2, '0');
        return `${m}:${sec}`;
    }

    // Shows a small toast notification
    function showToast(msg) {
        let toast = document.querySelector('.toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'toast';
            document.body.appendChild(toast);
        }
        toast.textContent = msg;
        requestAnimationFrame(() => toast.classList.add('visible'));
        setTimeout(() => toast.classList.remove('visible'), 4000);
    }


    // ── Dropdowns ─────────────────────────────────────

    function initDropdown(dropdownEl) {
        const trigger = dropdownEl.querySelector('.dropdown__trigger');
        const valueEl = dropdownEl.querySelector('.dropdown__value');
        const items   = dropdownEl.querySelectorAll('.dropdown__item');

        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelectorAll('.dropdown.open').forEach(d => {
                if (d !== dropdownEl) d.classList.remove('open');
            });
            dropdownEl.classList.toggle('open');
        });

        items.forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                items.forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                valueEl.textContent = item.textContent;
                dropdownEl.dataset.value = item.dataset.value;
                dropdownEl.classList.remove('open');
            });
        });
    }

    document.addEventListener('click', () => {
        document.querySelectorAll('.dropdown.open').forEach(d => d.classList.remove('open'));
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.dropdown.open').forEach(d => d.classList.remove('open'));
        }
    });

    initDropdown(dropdownLanguage);
    initDropdown(dropdownStyle);


    // ── Generate button state ─────────────────────────

    textInput.addEventListener('input', () => {
        btnGenerate.disabled = textInput.value.trim() === '';
    });


    // ── Main — Generate click ─────────────────────────

    let fullTranscript = '';

    btnGenerate.addEventListener('click', async () => {
        const topic    = textInput.value.trim();
        const language = dropdownLanguage.dataset.value;
        const style    = dropdownStyle.dataset.value;

        if (!topic) return;

        // ── UI: set loading state ──
        btnGenerate.classList.add('loading');
        btnGenerate.disabled = true;
        btnLoader.classList.remove('hidden');

        transcriptBody.textContent = '';
        fullTranscript = '';
        outputSection.classList.add('hidden');

        // ── Step 1: Stream the explanation text ──
        try {
            const formData = new FormData();
            formData.append('text', topic);
            formData.append('language', language);
            formData.append('style', style);

            const res = await fetch(`${API_BASE_URL}/stream-explain`, {
                method: 'POST',
                body: formData
            });

            if (!res.ok) throw new Error('Explanation failed.');

            const reader = res.body.getReader();
            const decoder = new TextDecoder();

            outputSection.classList.remove('hidden');

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                transcriptBody.textContent += chunk;
                fullTranscript += chunk;
            }

        } catch (err) {
            showToast(err.message || 'Something went wrong.');
            btnGenerate.classList.remove('loading');
            btnGenerate.disabled = false;
            btnLoader.classList.add('hidden');
            return;
        }

        // ── Step 2: Get audio using the full transcript ──
        try {
            const audioForm = new FormData();
            audioForm.append('text', fullTranscript);
            audioForm.append('language', language);

            const audioRes = await fetch(`${API_BASE_URL}/get-audio`, {
                method: 'POST',
                body: audioForm
            });

            if (!audioRes.ok) throw new Error('Audio generation failed.');

            const audioData = await audioRes.json();
            const byteChars = atob(audioData.audio);
            const byteArray = new Uint8Array(byteChars.length);
            for (let i = 0; i < byteChars.length; i++) {
                byteArray[i] = byteChars.charCodeAt(i);
            }

            const audioBlob = new Blob([byteArray], { type: 'audio/wav' });
            audioElement.src = URL.createObjectURL(audioBlob);
            audioElement.load();

            resetPlayer();

        } catch (err) {
            showToast(err.message || 'Audio failed.');
        }

        // ── UI: reset loading state ──
        btnGenerate.classList.remove('loading');
        btnGenerate.disabled = false;
        btnLoader.classList.add('hidden');
        textInput.value = '';
    });


    // ── Audio Player ──────────────────────────────────

    function resetPlayer() {
        iconPlay.classList.remove('hidden');
        iconPause.classList.add('hidden');
        progress.style.width = '0%';
        thumb.style.left = '0%';
        currentTimeEl.textContent = '0:00';
        durationEl.textContent = '0:00';
    }

    playBtn.addEventListener('click', () => {
        if (audioElement.paused) {
            audioElement.play();
            iconPlay.classList.add('hidden');
            iconPause.classList.remove('hidden');
        } else {
            audioElement.pause();
            iconPlay.classList.remove('hidden');
            iconPause.classList.add('hidden');
        }
    });

    audioElement.addEventListener('loadedmetadata', () => {
        durationEl.textContent = formatTime(audioElement.duration);
    });

    audioElement.addEventListener('timeupdate', () => {
        if (!audioElement.duration) return;
        const pct = (audioElement.currentTime / audioElement.duration) * 100;
        progress.style.width = pct + '%';
        thumb.style.left = pct + '%';
        currentTimeEl.textContent = formatTime(audioElement.currentTime);
    });

    audioElement.addEventListener('ended', () => {
        iconPlay.classList.remove('hidden');
        iconPause.classList.add('hidden');
    });

    progressBar.addEventListener('click', (e) => {
        if (!audioElement.duration) return;
        const rect  = progressBar.getBoundingClientRect();
        const ratio = (e.clientX - rect.left) / rect.width;
        audioElement.currentTime = ratio * audioElement.duration;
    });

})();