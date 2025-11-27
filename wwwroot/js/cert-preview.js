// ===== CERT-PREVIEW.JS - Preview exato do documento sem bordas =====
document.addEventListener('DOMContentLoaded', function () {
    const el = {
        preview: document.getElementById('certificatePreview'),
        fileInput: document.querySelector('input[name="certificadoVazioFile"]'),
        img: document.getElementById('certificadoVazioImg'),
        canvas: document.getElementById('pdfPreviewCanvas'),
        placeholder: document.getElementById('previewPlaceholder')
    };

    let currentPdfTask = null;
    const TARGET_HEIGHT = 600;
    const TARGET_WIDTH = 849;

    // ===== FUNÇÕES DE PREVIEW =====
    const resetPreview = () => {
        if (el.img) {
            el.img.src = '';
            el.img.style.display = 'none';
        }
        if (el.canvas) {
            const ctx = el.canvas.getContext('2d');
            ctx.clearRect(0, 0, el.canvas.width, el.canvas.height);
            el.canvas.style.display = 'none';
            el.canvas.width = 0;
            el.canvas.height = 0;
        }

        const positionInfo = document.getElementById('positionInfo');
        if (positionInfo) positionInfo.style.display = 'none';

        const draggable = document.getElementById('draggableNomeAluno');
        if (draggable) draggable.style.display = 'none';

        const draggableData = document.getElementById('draggableDataEmissao');
        if (draggableData) draggableData.style.display = 'none';

        if (el.placeholder) el.placeholder.style.display = 'flex';

        el.preview.style.height = 'auto';
        el.preview.style.minHeight = '450px';
        el.preview.style.width = 'auto';
    };

    const adjustContainer = (originalWidth, originalHeight) => {
        // Calcular escala para manter proporção A4 (2480x3508)
        const containerMaxWidth = el.preview.parentElement.clientWidth - 32; // padding
        const aspectRatio = TARGET_HEIGHT / TARGET_WIDTH; // ~1.41 (A4)

        // Calcular dimensões da preview mantendo a proporção
        let previewWidth = Math.min(containerMaxWidth, 600); // máximo 600px de largura
        let previewHeight = previewWidth * aspectRatio;

        // Aplicar dimensões exatas ao container
        el.preview.style.width = previewWidth + 'px';
        el.preview.style.height = previewHeight + 'px';
        el.preview.style.minHeight = previewHeight + 'px';
        el.preview.style.maxWidth = previewWidth + 'px';
        el.preview.style.padding = '0';
        el.preview.style.margin = '0 auto';
        el.preview.style.overflow = 'hidden';
        el.preview.style.border = 'none';
        el.preview.style.borderRadius = '0';
        el.preview.style.boxShadow = 'none';
        el.preview.style.outline = 'none';
        el.preview.style.boxSizing = 'border-box';
        el.preview.style.position = 'relative';

        // Armazenar escala global para uso nos draggables
        window.certificateScale = previewWidth / TARGET_WIDTH;
        window.certificateDimensions = {
            width: TARGET_WIDTH,
            height: TARGET_HEIGHT,
            previewWidth: previewWidth,
            previewHeight: previewHeight
        };

        console.log(`📐 Preview: ${previewWidth}x${previewHeight}px (escala: ${window.certificateScale.toFixed(3)})`);
        console.log(`📄 Documento real: ${TARGET_WIDTH}x${TARGET_HEIGHT}px`);
    };

    const renderImage = (file) => {
        resetPreview();

        const reader = new FileReader();
        reader.onload = (e) => {
            const tempImg = new Image();
            tempImg.onload = () => {
                // Ajustar container para proporção A4
                adjustContainer(tempImg.width, tempImg.height);

                // Criar canvas para redimensionar a imagem exatamente para 2480x3508
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = TARGET_WIDTH;
                tempCanvas.height = TARGET_HEIGHT;
                const tempCtx = tempCanvas.getContext('2d');

                // Desenhar imagem redimensionada no canvas temporário
                tempCtx.drawImage(tempImg, 0, 0, TARGET_WIDTH, TARGET_HEIGHT);

                // Converter para data URL e aplicar à imagem de preview
                el.img.src = tempCanvas.toDataURL('image/png');
                el.img.style.display = 'block';
                if (el.placeholder) el.placeholder.style.display = 'none';

                // Aplicar estilos para ocupar 100% do container (que já tem o tamanho correto)
                Object.assign(el.img.style, {
                    width: '100%',
                    height: '100%',
                    display: 'block',
                    margin: '0',
                    padding: '0',
                    objectFit: 'fill',
                    position: 'absolute',
                    top: '0',
                    left: '0',
                    border: 'none',
                    borderRadius: '0',
                    outline: 'none',
                    boxShadow: 'none',
                    imageRendering: 'auto'
                });

                if (window.showDraggableNomeAluno) {
                    window.showDraggableNomeAluno();
                }

                if (window.showDraggableDataEmissao) {
                    window.showDraggableDataEmissao();
                }

                console.log('✅ Imagem carregada e redimensionada para ' + TARGET_WIDTH + 'x' + TARGET_HEIGHT);
            };
            tempImg.src = e.target.result;
        };
        reader.readAsDataURL(file);
    };

    const renderPDF = async (file) => {
        if (!window.pdfjsLib) {
            alert('Erro: PDF.js não carregado. Recarregue a página.');
            return;
        }

        resetPreview();

        try {
            if (currentPdfTask) {
                await currentPdfTask.cancel();
                currentPdfTask = null;
            }

            const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
            const page = await pdf.getPage(1);

            // Obter viewport original
            const originalViewport = page.getViewport({ scale: 1 });

            // Calcular escala para atingir exatamente 2480x3508
            const scaleX = TARGET_WIDTH / originalViewport.width;
            const scaleY = TARGET_HEIGHT / originalViewport.height;
            const scale = Math.min(scaleX, scaleY); // usar menor escala para manter proporção

            const scaledViewport = page.getViewport({ scale });

            // Ajustar container
            adjustContainer(scaledViewport.width, scaledViewport.height);

            // Configurar canvas com dimensões exatas do documento
            el.canvas.width = TARGET_WIDTH;
            el.canvas.height = TARGET_HEIGHT;

            // Renderizar PDF no canvas
            currentPdfTask = page.render({
                canvasContext: el.canvas.getContext('2d'),
                viewport: page.getViewport({ scale: TARGET_WIDTH / originalViewport.width })
            });

            await currentPdfTask.promise;
            currentPdfTask = null;

            // Aplicar estilos para ocupar 100% do container
            Object.assign(el.canvas.style, {
                display: 'block',
                width: '100%',
                height: '100%',
                margin: '0',
                padding: '0',
                objectFit: 'fill',
                position: 'absolute',
                top: '0',
                left: '0',
                border: 'none',
                borderRadius: '0',
                outline: 'none',
                boxShadow: 'none',
                imageRendering: 'auto'
            });

            if (el.placeholder) el.placeholder.style.display = 'none';

            if (window.showDraggableNomeAluno) {
                window.showDraggableNomeAluno();
            }

            if (window.showDraggableDataEmissao) {
                window.showDraggableDataEmissao();
            }

            console.log(`✅ PDF renderizado: ${TARGET_WIDTH}x${TARGET_HEIGHT}px`);

        } catch (error) {
            if (error.name !== 'RenderingCancelledException') {
                console.error('Erro PDF:', error);
                alert('Erro ao carregar PDF.');
                resetPreview();
            }
            currentPdfTask = null;
        }
    };

    // ===== VALIDAÇÃO DE ARQUIVO =====
    const validateFile = (file) => {
        const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
        const maxSize = 10 * 1024 * 1024; // 10MB

        if (!validTypes.includes(file.type)) {
            alert('❌ Erro: Apenas arquivos PNG, JPG ou PDF são aceitos.');
            return false;
        }

        if (file.size > maxSize) {
            alert('❌ Erro: O arquivo deve ter no máximo 10MB.');
            return false;
        }

        return true;
    };

    // ===== UPLOAD =====
    el.fileInput?.addEventListener('change', async (e) => {
        const file = e.target.files[0];

        if (!file) {
            resetPreview();
            return;
        }

        if (!validateFile(file)) {
            e.target.value = '';
            resetPreview();
            return;
        }

        if (file.type === 'application/pdf') {
            await renderPDF(file);
        } else if (file.type.startsWith('image/')) {
            renderImage(file);
        }
    });

    // ===== RESIZE =====
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(async () => {
            const file = el.fileInput?.files[0];
            if (!file) return;

            if (file.type === 'application/pdf') {
                await renderPDF(file);
            } else if (file.type.startsWith('image/')) {
                renderImage(file);
            }
        }, 250);
    });

    console.log('✅ Preview Module carregado (2480x3508px fixo)');

    // ⭐ Função global para ajustar tamanho dos draggables
    window.adjustDraggableSize = function (element) {
        if (!element) return;

        const textElement = element.querySelector('.draggable-text');
        if (!textElement) return;

        // Forçar recalculo
        textElement.style.width = 'auto';
        textElement.style.maxWidth = 'none';

        // Aguardar o DOM atualizar
        requestAnimationFrame(() => {
            const textWidth = textElement.scrollWidth;
            const textHeight = textElement.scrollHeight;

            // Não definir width/height no elemento, deixar inline-flex fazer o trabalho
            console.log(`📏 Tamanho do texto: ${textWidth}x${textHeight}px`);
        });
    };
});