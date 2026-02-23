document.addEventListener('DOMContentLoaded', () => {
    
    const body = document.body;
    const currentYearSpan = document.getElementById('currentYear');

    // Set current year in footer
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    // Scroll indicator logic (hide when footer is visible)
    const scrollIndicator = document.querySelector('.scroll-indicator');
    const footer = document.querySelector('.main-footer');
    
    if (scrollIndicator && footer) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Footer is visible, hide arrow
                    scrollIndicator.style.opacity = '0';
                    scrollIndicator.style.pointerEvents = 'none';
                } else {
                    // Footer is not visible, show arrow
                    scrollIndicator.style.opacity = '0.7';
                    scrollIndicator.style.pointerEvents = 'auto';
                }
            });
        }, { threshold: 0.1 }); // Trigger when 10% of footer is visible

        observer.observe(footer);
    }

    // Light switch interaction logic
    let isLightOn = false;
    let currentAudio = null;
    let fadeInterval = null;
    let lastTrack = null;

    const audioTracks = [
        'assets/Birds In The Rain.mp3',
        'assets/Rain On The Roof.mp3',
        'assets/Water Stream.mp3'
    ];

    const interactiveScene = document.getElementById('interactiveScene');

    // Small hack to scatter the music notes slightly using custom properties
    const notes = document.querySelectorAll('.music-note');
    notes.forEach(note => {
        // Random value between 0 and 1
        note.style.setProperty('--rand', Math.random());
    });

    const toggleLight = () => {
        isLightOn = !isLightOn;

        if (isLightOn) {
            // Turn light ON
            body.classList.remove('dark-mode');
            body.classList.add('light-mode');
            
            // Clear any active fade
            if (fadeInterval) clearInterval(fadeInterval);

            // Stop any playing audio
            if (currentAudio) {
                currentAudio.pause();
                currentAudio.currentTime = 0;
            }
            // Pick a random audio track (ensure it's not the same as the last one)
            let randomTrack;
            do {
                randomTrack = audioTracks[Math.floor(Math.random() * audioTracks.length)];
            } while (randomTrack === lastTrack && audioTracks.length > 1);
            
            lastTrack = randomTrack;
            
            currentAudio = new Audio(randomTrack);
            currentAudio.loop = true;
            currentAudio.volume = 0; // Start silent
            currentAudio.play().catch(e => console.error("Audio block:", e));
            
            // Fade in over ~500ms (20 steps of 25ms), max volume 0.5
            fadeInterval = setInterval(() => {
                if (currentAudio && currentAudio.volume < 0.5) {
                    currentAudio.volume = Math.min(0.5, currentAudio.volume + 0.025);
                } else {
                    clearInterval(fadeInterval);
                }
            }, 25);
            
            playClickSound();
        } else {
            // Turn light OFF
            body.classList.remove('light-mode');
            body.classList.add('dark-mode');
            
            // Clear any active fade
            if (fadeInterval) clearInterval(fadeInterval);

            // Fade out current audio
            if (currentAudio) {
                fadeInterval = setInterval(() => {
                    if (currentAudio && currentAudio.volume > 0) {
                        currentAudio.volume = Math.max(0, currentAudio.volume - 0.05);
                    } else {
                        clearInterval(fadeInterval);
                        if (currentAudio) currentAudio.pause();
                    }
                }, 25);
            }
            
            playClickSound();
        }
    };

    interactiveScene.addEventListener('click', toggleLight);
    
    // Add keyboard interaction for accessibility
    interactiveScene.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleLight();
        }
    });

    // Helper to synthesise a tiny click sound
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    function playClickSound() {
        if(audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.type = 'sine';
        // Higher pitch for 'on', lower for 'off' gives nice feedback
        oscillator.frequency.setValueAtTime(isLightOn ? 600 : 400, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        
        // Lowered overall volume from 0.5 to 0.1 for a subtle click
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.1);
    }
});
