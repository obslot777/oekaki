document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('drawingCanvas');
    const ctx = canvas.getContext('2d');
    const colorButtons = document.querySelectorAll('.color-button');
    const showAnimalButton = document.getElementById('showAnimalButton');
    const undoButton = document.getElementById('undoButton');
    const clearButton = document.getElementById('clearButton');

    // キャンバスのサイズを設定（画面サイズに合わせる）
    const canvasWidth = Math.min(window.innerWidth * 0.8, 600);
    const canvasHeight = Math.min(window.innerHeight * 0.6, 400);
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    let drawing = false;
    let currentColor = '#000000'; // 初期色を黒に設定
    let lastX = 0;
    let lastY = 0;
    let drawingHistory = []; // 描画履歴を保存する配列
    let currentPath = []; // 現在描画中のパス

    // 初期設定
    ctx.lineWidth = 10; // 線の太さ（太めにして描きやすく）
    ctx.lineCap = 'round'; // 線の端を丸く
    ctx.lineJoin = 'round'; // 線と線のつなぎ目を丸く

    // --- 動物の画像ファイルパス ---
    // ここをダウンロードして保存したローカルファイルパスに置き換えてください
    const animalImages = {
        dog: 'dog.png',
        cat: 'cat.png',
        elephant: 'elephant.png'
    };

    let currentAnimalImage = null; // 現在表示されている動物の画像

    // 色選択ボタンのイベントリスナー
    colorButtons.forEach(button => {
        button.addEventListener('click', () => {
            document.querySelector('.color-button.active')?.classList.remove('active');
            button.classList.add('active');
            currentColor = button.dataset.color;
        });
    });

    // キャンバスをクリア
    clearButton.addEventListener('click', () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawingHistory = []; // 履歴もクリア
        currentAnimalImage = null; // 画像もクリア
        redrawCanvas(); // クリア後に再描画
    });

    // 一つもどす
    undoButton.addEventListener('click', () => {
        if (drawingHistory.length > 0) {
            drawingHistory.pop(); // 最新の描画を削除
            redrawCanvas(); // キャンバスを再描画
        }
    });

    // --- 動物のイラストを表示する機能 ---
    showAnimalButton.addEventListener('click', () => {
        // 現在のキャンバスをクリア
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawingHistory = []; // 履歴もクリア

        // ランダムな動物を選択
        const animals = Object.keys(animalImages);
        const randomAnimalKey = animals[Math.floor(Math.random() * animals.length)];
        const imagePath = animalImages[randomAnimalKey];

        // 画像を読み込んでキャンバスに描画
        const img = new Image();
        // img.crossOrigin = "Anonymous"; // ローカルファイルからは不要
        img.src = imagePath;
        img.onload = () => {
            // 画像をキャンバスの中央に、アスペクト比を保ちつつ収まるように描画
            const hRatio = canvas.width / img.width;
            const vRatio = canvas.height / img.height;
            const ratio = Math.min(hRatio, vRatio);
            const centerShiftX = (canvas.width - img.width * ratio) / 2;
            const centerShiftY = (canvas.height - img.height * ratio) / 2;

            ctx.globalAlpha = 0.4; // 透明度を設定（なぞりやすくするため）
            ctx.drawImage(img, 0, 0, img.width, img.height,
                          centerShiftX, centerShiftY, img.width * ratio, img.height * ratio);
            ctx.globalAlpha = 1.0; // 透明度を元に戻す

            currentAnimalImage = { img: img, x: centerShiftX, y: centerShiftY, width: img.width * ratio, height: img.height * ratio };
        };
        img.onerror = () => {
            console.error('画像の読み込みに失敗しました:', imagePath);
            alert('動物の画像を読み込めませんでした。ファイルが正しく配置されているか確認してください。');
        };
    });

    // 描画開始（マウス・タッチ共通）
    function startDrawing(e) {
        drawing = true;
        const { x, y } = getEventPos(e);
        [lastX, lastY] = [x, y];
        currentPath = [{ x: lastX, y: lastY, color: currentColor, width: ctx.lineWidth }];
    }

    // 描画中（マウス・タッチ共通）
    function draw(e) {
        if (!drawing) return;

        if (e.type === 'touchmove') {
            e.preventDefault();
        }

        const { x, y } = getEventPos(e);
        ctx.strokeStyle = currentColor;
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);
        ctx.stroke();

        currentPath.push({ x: x, y: y, color: currentColor, width: ctx.lineWidth });

        [lastX, lastY] = [x, y];
    }

    // 描画終了（マウス・タッチ共通）
    function stopDrawing() {
        if (drawing) {
            drawing = false;
            if (currentPath.length > 1) {
                drawingHistory.push(currentPath);
            }
            currentPath = [];
        }
    }

    // キャンバスを履歴に基づいて再描画する関数
    function redrawCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height); // 一度クリア

        // もし動物の画像が表示されていれば、まずそれを描画
        if (currentAnimalImage) {
            ctx.globalAlpha = 0.4; // 透明度を設定
            ctx.drawImage(currentAnimalImage.img, currentAnimalImage.x, currentAnimalImage.y, currentAnimalImage.width, currentAnimalImage.height);
            ctx.globalAlpha = 1.0; // 透明度を元に戻す
        }

        drawingHistory.forEach(path => {
            if (path.length > 1) {
                ctx.strokeStyle = path[0].color;
                ctx.lineWidth = path[0].width;
                ctx.beginPath();
                ctx.moveTo(path[0].x, path[0].y);
                for (let i = 1; i < path.length; i++) {
                    ctx.lineTo(path[i].x, path[i].y);
                }
                ctx.stroke();
            }
        });
    }

    // マウスイベント
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);

    // タッチイベント
    canvas.addEventListener('touchstart', startDrawing);
    canvas.addEventListener('touchmove', draw);
    canvas.addEventListener('touchend', stopDrawing);
    canvas.addEventListener('touchcancel', stopDrawing);

    // イベントからキャンバス上の座標を取得するヘルパー関数
    function getEventPos(e) {
        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;

        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }
});