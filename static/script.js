// Wrap everything in an IIFE (Immediately Invoked Function Expression)
// This keeps all our variables private — nothing leaks to the global scope
(() => {
    'use strict';

    // ── DOM refs ──────────────────────────────────────
    // Grab every element we need from the HTML upfront
    // document.getElementById finds an element by its id attribute
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
    // Example: 90 seconds becomes "1:30"
    function formatTime(s) {
        if (isNaN(s) || !isFinite(s)) return '0:00';
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60).toString().padStart(2, '0');
        return `${m}:${sec}`;
    }

    // Shows a small toast notification at the bottom of the screen
    // Used for errors so we don't use ugly browser alerts
    function showToast(msg) {
        let toast = document.querySelector('.toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'toast';
            document.body.appendChild(toast);
        }
        toast.textContent = msg;
        // requestAnimationFrame waits for the browser to be ready to paint
        // without this the CSS transition won't trigger properly
        requestAnimationFrame(() => toast.classList.add('visible'));
        setTimeout(() => toast.classList.remove('visible'), 4000);
    }


    // ── Dropdowns ─────────────────────────────────────

    // This function handles open/close and selection for a single dropdown
    // We call it twice — once for language, once for style
    function initDropdown(dropdownEl) {
        const trigger = dropdownEl.querySelector('.dropdown__trigger');
        const valueEl = dropdownEl.querySelector('.dropdown__value');
        const items   = dropdownEl.querySelectorAll('.dropdown__item');

        // When the trigger is clicked, toggle this dropdown open or closed
        // e.stopPropagation() prevents the document click listener below from
        // immediately closing it right after we open it
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();

            // Close any other open dropdowns first
            document.querySelectorAll('.dropdown.open').forEach(d => {
                if (d !== dropdownEl) d.classList.remove('open');
            });

            dropdownEl.classList.toggle('open');
        });

        // When a dropdown item is clicked, update the selected value
        items.forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();

                // Mark this item as active, remove active from others
                items.forEach(i => i.classList.remove('active'));
                item.classList.add('active');

                // Show the selected label in the trigger button
                valueEl.textContent = item.textContent;

                // Store the actual value (e.g. "hindi") on the dropdown element
                // We read this later when the user clicks Generate
                dropdownEl.dataset.value = item.dataset.value;

                dropdownEl.classList.remove('open');
            });
        });
    }

    // Close all dropdowns if user clicks anywhere outside them
    document.addEventListener('click', () => {
        document.querySelectorAll('.dropdown.open').forEach(d => d.classList.remove('open'));
    });

    // Also close dropdowns on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.dropdown.open').forEach(d => d.classList.remove('open'));
        }
    });

    // Initialise both dropdowns
    initDropdown(dropdownLanguage);
    initDropdown(dropdownStyle);


    // ── Generate button state ─────────────────────────

    // Disable the generate button if the text input is empty
    // Runs every time the user types something
    textInput.addEventListener('input', () => {
        btnGenerate.disabled = textInput.value.trim() === '';
    });


    // ── Main — Generate click ─────────────────────────

    // We store the full transcript here after streaming is done
    // We need it to send to /get-audio after streaming completes
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

        // Clear previous transcript and hide output while loading
        transcriptBody.textContent = '';
        fullTranscript = '';
        outputSection.classList.add('hidden');

        // ── Step 1: Stream the explanation text ──
        try {
            // FormData is how we send form fields in a POST request
            const formData = new FormData();
            formData.append('text', topic);
            formData.append('language', language);
            formData.append('style', style);

            const res = await fetch('/stream-explain', {
                method: 'POST',
                body: formData
            });

            if (!res.ok) throw new Error('Explanation failed.');

            // res.body is a ReadableStream — data arrives in chunks
            // getReader() gives us a way to read those chunks one by one
            const reader = res.body.getReader();

            // TextDecoder converts raw bytes (Uint8Array) into readable text
            const decoder = new TextDecoder();

            // Show the output section now so user sees text appearing
            outputSection.classList.remove('hidden');

            // Keep reading chunks until the stream is done
            while (true) {
                // read() waits for the next chunk to arrive
                // done = true means the stream has ended
                // value = the chunk as a Uint8Array (raw bytes)
                const { done, value } = await reader.read();

                if (done) break;

                // Decode the bytes into a string
                const chunk = decoder.decode(value, { stream: true });

                // Append this chunk to the transcript on screen
                transcriptBody.textContent += chunk;

                // Also save it so we can send it to /get-audio later
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

            const audioRes = await fetch('/get-audio', {
                method: 'POST',
                body: audioForm
            });

            if (!audioRes.ok) throw new Error('Audio generation failed.');

            const audioData = await audioRes.json();

            // Convert base64 string back to raw bytes
            // atob() decodes a base64 string into a binary string
            const byteChars = atob(audioData.audio);

            // Convert the binary string into an actual byte array
            const byteArray = new Uint8Array(byteChars.length);
            for (let i = 0; i < byteChars.length; i++) {
                byteArray[i] = byteChars.charCodeAt(i);
            }

            // Wrap the byte array in a Blob — a file-like object in the browser
            const audioBlob = new Blob([byteArray], { type: 'audio/wav' });

            // Create a temporary URL pointing to this blob
            // so the audio element can play it
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

    // Reset the player UI back to 0 when new audio is loaded
    function resetPlayer() {
        iconPlay.classList.remove('hidden');
        iconPause.classList.add('hidden');
        progress.style.width = '0%';
        thumb.style.left = '0%';
        currentTimeEl.textContent = '0:00';
        durationEl.textContent = '0:00';
    }

    // Play or pause when the button is clicked
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

    // Once audio metadata loads, show the total duration
    audioElement.addEventListener('loadedmetadata', () => {
        durationEl.textContent = formatTime(audioElement.duration);
    });

    // As audio plays, update the progress bar and current time display
    audioElement.addEventListener('timeupdate', () => {
        if (!audioElement.duration) return;
        const pct = (audioElement.currentTime / audioElement.duration) * 100;
        progress.style.width = pct + '%';
        thumb.style.left = pct + '%';
        currentTimeEl.textContent = formatTime(audioElement.currentTime);
    });

    // When audio finishes, show the play icon again
    audioElement.addEventListener('ended', () => {
        iconPlay.classList.remove('hidden');
        iconPause.classList.add('hidden');
    });

    // Click anywhere on the progress bar to jump to that position
    progressBar.addEventListener('click', (e) => {
        if (!audioElement.duration) return;
        const rect  = progressBar.getBoundingClientRect();
        const ratio = (e.clientX - rect.left) / rect.width;
        audioElement.currentTime = ratio * audioElement.duration;
    });

})();