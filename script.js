const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const startButton = document.getElementById("start");
const status = document.getElementById("status");

// Размер canvas
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// MediaPipe Hands
const hands = new Hands({
    locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
    }
});

hands.setOptions({
    maxNumHands: 2,
    modelComplexity: 1,
    minDetectionConfidence: 0.6,
    minTrackingConfidence: 0.6
});

// Обработка рук
hands.onResults((results) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const fingers = [];

    if (results.multiHandLandmarks) {
        for (const landmarks of results.multiHandLandmarks) {
            const finger = landmarks[8];

            const x = finger.x * canvas.width;
            const y = finger.y * canvas.height;

            fingers.push({ x, y });

            // Светящаяся точка
            ctx.beginPath();
            ctx.arc(x, y, 9, 0, Math.PI * 2);

            ctx.fillStyle = "#00ff88";
            ctx.shadowBlur = 25;
            ctx.shadowColor = "#00ff88";

            ctx.fill();

            ctx.shadowBlur = 0;
        }
    }

    // Если найдены две руки
    if (fingers.length >= 2) {
        const p1 = fingers[0];
        const p2 = fingers[1];

        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;

        const distance = Math.sqrt(
            dx * dx + dy * dy
        );

        // Центр портала
        const centerX = (p1.x + p2.x) / 2;
        const centerY = (p1.y + p2.y) / 2;

        // Размер портала
        const width = Math.max(150, distance * 1.2);
        const height = width * 0.58;

        const left = centerX - width / 2;
        const top = centerY - height / 2;

        // Линия между пальцами
        ctx.beginPath();

        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);

        ctx.strokeStyle = "#00ff88";
        ctx.lineWidth = 4;

        ctx.shadowBlur = 25;
        ctx.shadowColor = "#00ff88";

        ctx.stroke();

        ctx.shadowBlur = 0;

        // Внешняя рамка портала
        ctx.save();

        ctx.shadowBlur = 45;
        ctx.shadowColor = "#00ff88";

        ctx.strokeStyle = "#00ff88";
        ctx.lineWidth = 5;

        ctx.strokeRect(
            left,
            top,
            width,
            height
        );

        ctx.restore();

        // Свечение внутри
        const gradient = ctx.createRadialGradient(
            centerX,
            centerY,
            10,
            centerX,
            centerY,
            width
        );

        gradient.addColorStop(
            0,
            "rgba(0,255,136,0.45)"
        );

        gradient.addColorStop(
            0.5,
            "rgba(0,255,200,0.15)"
        );

        gradient.addColorStop(
            1,
            "rgba(0,255,136,0)"
        );

        ctx.fillStyle = gradient;

        ctx.fillRect(
            left,
            top,
            width,
            height
        );

        // Внутренняя рамка
        ctx.strokeStyle = "rgba(0,255,136,0.8)";
        ctx.lineWidth = 2;

        ctx.strokeRect(
            left + 10,
            top + 10,
            width - 20,
            height - 20
        );

        // Текст
        ctx.font = "bold 18px Arial";

        ctx.fillStyle = "#00ff88";

        ctx.shadowBlur = 15;
        ctx.shadowColor = "#00ff88";

        ctx.fillText(
            "PORTAL ACTIVE",
            left,
            top - 15
        );

        ctx.shadowBlur = 0;

        status.textContent =
            "PORTAL ACTIVE • " +
            Math.round(distance) +
            " px";

    } else {
        status.textContent = "Покажи две руки 👋";
    }
});

// Камера
startButton.addEventListener("click", async () => {

    try {

        const stream =
            await navigator.mediaDevices.getUserMedia({
                video: {
                    width: 1280,
                    height: 720,
                    facingMode: "user"
                },
                audio: false
            });

        video.srcObject = stream;

        startButton.style.display = "none";

        // Обработка кадров
        async function processFrame() {

            if (video.readyState >= 2) {
                await hands.send({
                    image: video
                });
            }

            requestAnimationFrame(processFrame);
        }

        processFrame();

    } catch (error) {

        console.error(error);

        status.textContent =
            "Не удалось открыть камеру";

        alert(
            "Разреши доступ к камере браузеру."
        );
    }
});
