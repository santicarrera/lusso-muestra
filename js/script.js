document.addEventListener('DOMContentLoaded', () => {
    // ------------------------------------------
    // 1. Variables Globales y Estado Inicial
    // ------------------------------------------
    const ADMIN_PASSWORD = "luso_admin"; // Contraseña simple para el demo
    let isLoggedIn = false;
    let products = JSON.parse(localStorage.getItem('lusoProducts')) || []; // Cargar productos de localStorage o array vacío
    let editingProductId = null; // Para saber si estamos editando o creando

    // ------------------------------------------
    // 2. Referencias del DOM
    // ------------------------------------------
    const $productsGrid = document.getElementById('productsGrid');
    const $emptyState = document.getElementById('emptyState');
    const $categoryFilter = document.getElementById('categoryFilter');
    
    // Admin
    const $btnAdmin = document.getElementById('btnAdmin');
    const $adminPanel = document.getElementById('adminPanel');
    const $btnLogout = document.getElementById('btnLogout');

    // Login Modal
    const $loginModal = document.getElementById('loginModal');
    const $passwordInput = document.getElementById('passwordInput');
    const $btnLogin = document.getElementById('btnLogin');
    const $btnCancelLogin = document.getElementById('btnCancelLogin');

    // Product Modal (Formulario)
    const $productModal = document.getElementById('productModal');
    const $modalTitle = document.getElementById('modalTitle');
    const $btnNewProduct = document.getElementById('btnNewProduct');
    const $productName = document.getElementById('productName');
    const $productCategory = document.getElementById('productCategory');
    const $productPrice = document.getElementById('productPrice');
    const $sizeButtons = document.getElementById('sizeButtons');
    const $productStock = document.getElementById('productStock');
    const $btnSaveProduct = document.getElementById('btnSaveProduct');
    const $btnCancelProduct = document.getElementById('btnCancelProduct');
    
    const $productImageFileMain = document.getElementById('productImageFileMain');
    const $productImageFileHover = document.getElementById('productImageFileHover');
    const $productImageMain = document.getElementById('productImageMain');
    const $productImageHover = document.getElementById('productImageHover');
    const $imagePreviewMain = document.getElementById('imagePreviewMain');
    const $imagePreviewHover = document.getElementById('imagePreviewHover');
    const $imagePreviewContainer = document.getElementById('imagePreviewContainer');

    // ------------------------------------------
    // 3. Funciones de Persistencia (CRUD - Productos)
    // ------------------------------------------

    /**
     * Guarda el array de productos actual en localStorage.
     */
    const saveProducts = () => {
        localStorage.setItem('lusoProducts', JSON.stringify(products));
    };

    /**
     * Limpia y renderiza la lista de productos en el grid.
     * @param {string} filterCategory - La categoría a filtrar. 'all' por defecto.
     */
    const renderProducts = (filterCategory = 'all') => {
        const filteredProducts = products.filter(product => 
            filterCategory === 'all' || product.category === filterCategory
        );

        $productsGrid.innerHTML = ''; // Limpiar el grid

        if (filteredProducts.length === 0) {
            $emptyState.style.display = 'block';
            return;
        }

        $emptyState.style.display = 'none';

        filteredProducts.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.setAttribute('data-category', product.category);
            
            // 1. Manejo de imágenes
            const images = Array.isArray(product.image) ? product.image : [product.image];
            const mainImg = images[0] || 'placeholder.jpg';
            const hoverImg = images[1] || mainImg;

            // 2. Definición de variables para WhatsApp
            const nroTelefono = "5492617086875"; // El número de tu amigo
            const mensajeWa = encodeURIComponent(`Hola LUSSO! Me interesa el producto: ${product.name}. ¿Tienen disponibilidad?`);
            const urlWhatsapp = `https://wa.me/${nroTelefono}?text=${mensajeWa}`;

            const badgeHTML = product.stock <= 3 && product.stock > 0 
                ? `<div class="product-badge" style="background-color: #f87171; color: white;">¡Últimos!</div>` 
                : `<div class="product-badge">Nuevo</div>`;

            productCard.innerHTML = `
                <div class="product-image">
                    ${badgeHTML}
                    <img src="${mainImg}" class="img-main" alt="${product.name}">
                    <img src="${hoverImg}" class="img-hover" alt="${product.name}">
                </div>
                <div class="product-info">
                    <div class="product-name" style="color: var(--gray-text); font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px;">${product.category}</div>
                    <div class="product-name" style="margin-bottom: 5px; font-size: 1.2rem;">${product.name}</div>
                    <div class="product-price">$${product.price.toLocaleString('es-AR')}</div>
                    <div class="product-sizes">
                        ${product.sizes.map(size => `<span class="size-tag">${size}</span>`).join('')}
                    </div>
                    ${isLoggedIn ? `
                        <div class="product-stock">Stock: ${product.stock}</div>
                        <div class="product-actions">
                            <button class="btn-edit" data-id="${product.id}">Editar</button>
                            <button class="btn-delete" data-id="${product.id}">Borrar</button>
                        </div>
                    ` : `
                        <a href="${urlWhatsapp}" target="_blank" class="btn-whatsapp">
                            Consultar disponibilidad
                        </a>
                    `}
                </div>
            `;
            $productsGrid.appendChild(productCard);
        });
        // Re-asignar event listeners después de renderizar
        if (isLoggedIn) {
            document.querySelectorAll('.btn-edit').forEach(button => {
                button.addEventListener('click', (e) => openProductModal(e.currentTarget.dataset.id));
            });
            document.querySelectorAll('.btn-delete').forEach(button => {
                button.addEventListener('click', (e) => deleteProduct(e.currentTarget.dataset.id));
            });
        }
    };

    /**
     * Abre el modal para crear o editar un producto.
     * @param {string|null} productId - ID del producto a editar. Si es null, crea uno nuevo.
     */
    const openProductModal = (productId = null) => {
        editingProductId = productId;
        clearProductForm();

        if (productId) {
            $modalTitle.textContent = "Editar Producto";
            const product = products.find(p => p.id === productId);
            if (product) {
                $productName.value = product.name;
                $productCategory.value = product.category;
                $productPrice.value = product.price;
                $productStock.value = product.stock;

                const images = Array.isArray(product.image) ? product.image : [product.image];
                $productImageMain.value = images[0] || '';
                $productImageHover.value = images[1] || '';

                if (images[0] || images[1]) {
                    $imagePreviewMain.src = images[0] || '';
                    $imagePreviewHover.src = images[1] || '';
                    $imagePreviewContainer.style.display = 'block';
                } else {
                    $imagePreviewContainer.style.display = 'none';
                }

                // Seleccionar talles
                document.querySelectorAll('.size-btn').forEach(btn => {
                    const size = btn.getAttribute('data-size');
                    if (product.sizes.includes(size)) {
                        btn.classList.add('active');
                    }
                });
            }
        } else {
            $modalTitle.textContent = "Nuevo Producto";
        }

        $productModal.classList.add('active');
    };

    /**
     * Maneja el guardado/actualización del producto.
     */
    const handleSaveProduct = () => {
        const name = $productName.value.trim();
    const category = $productCategory.value;
    const price = parseFloat($productPrice.value);
    const stock = parseInt($productStock.value);
    const sizes = Array.from(document.querySelectorAll('.size-btn.active')).map(btn => btn.dataset.size);

        // Validaciones
        if (!name || !category || isNaN(price) || isNaN(stock) || sizes.length === 0 || price <= 0 || stock < 0) {
            alert("Por favor, completa todos los campos requeridos y asegúrate de que el precio y stock sean válidos.");
            return;
        }

        // Capturamos las dos imágenes y las guardamos como un array
        const mainImg = $productImageMain.value.trim();
        const hoverImg = $productImageHover.value.trim();
        const images = [mainImg, hoverImg];

        // Al guardar el objeto producto, usa 'image: images'
        if (editingProductId) {
            // Editar
            const productIndex = products.findIndex(p => p.id === editingProductId);
            if (productIndex !== -1) {
                products[productIndex] = { ...products[productIndex], name, category, price, stock, sizes, image: images };
            }
        } else {
            // Crear nuevo
            const newProduct = {
                id: Date.now().toString(),
                name, category, price, stock, sizes, image: images
            };
            products.push(newProduct);
        }

        saveProducts();
        closeProductModal();
        renderProducts(document.querySelector('.category-btn.active').dataset.category); // Re-renderizar con filtro actual
    };

    /**
     * Elimina un producto.
     * @param {string} productId - ID del producto a eliminar.
     */
    const deleteProduct = (productId) => {
        if (confirm("¿Estás seguro de que deseas eliminar este producto?")) {
            products = products.filter(p => p.id !== productId);
            saveProducts();
            renderProducts(document.querySelector('.category-btn.active').dataset.category);
        }
    };

    // ------------------------------------------
    // 4. Funciones de UI/Interacción
    // ------------------------------------------

    /**
     * Limpia los inputs del formulario de producto.
     */
    const clearProductForm = () => {
        // Campos de texto y select
        $productName.value = '';
        $productCategory.value = 'remeras'; 
        $productPrice.value = '';
        $productStock.value = '';

        // Limpieza de imágenes (Inputs ocultos con el Base64)
        $productImageMain.value = '';
        $productImageHover.value = '';

        // Limpieza de selectores de archivos (Explorador)
        $productImageFileMain.value = ''; 
        $productImageFileHover.value = '';

        // Limpieza de las miniaturas de vista previa
        $imagePreviewMain.src = '';
        $imagePreviewHover.src = '';
        $imagePreviewContainer.style.display = 'none';

        // Reset de los botones de talles
        document.querySelectorAll('.size-btn').forEach(btn => btn.classList.remove('active'));
    };

    /**
     * Cierra el modal de producto.
     */
    const closeProductModal = () => {
        $productModal.classList.remove('active');
        editingProductId = null;
    };

    /**
     * Maneja el toggle de los botones de talle.
     */
    const handleSizeToggle = (e) => {
        if (e.target.classList.contains('size-btn')) {
            e.target.classList.toggle('active');
        }
    };
    
    /**
     * Actualiza el estado de logueo del administrador.
     * @param {boolean} loggedIn - true si está logueado, false si no.
     */
    const setAdminStatus = (loggedIn) => {
        isLoggedIn = loggedIn;
        if (loggedIn) {
            $adminPanel.style.display = 'block';
            $btnAdmin.style.display = 'none';
        } else {
            $adminPanel.style.display = 'none';
            $btnAdmin.style.display = 'flex';
        }
        renderProducts(document.querySelector('.category-btn.active').dataset.category); // Re-renderizar para mostrar/ocultar botones de admin
    };

    // ------------------------------------------
    // 5. Manejo del Login y Panel de Admin
    // ------------------------------------------

    $btnAdmin.addEventListener('click', () => {
        $loginModal.classList.add('active');
        $passwordInput.focus();
    });

    $btnCancelLogin.addEventListener('click', () => {
        $loginModal.classList.remove('active');
        $passwordInput.value = '';
    });

    // Login (tanto por botón como por tecla Enter)
    const attemptLogin = () => {
        if ($passwordInput.value === ADMIN_PASSWORD) {
            alert('¡Acceso concedido!');
            $loginModal.classList.remove('active');
            $passwordInput.value = '';
            setAdminStatus(true);
        } else {
            alert('Contraseña incorrecta.');
            $passwordInput.value = '';
            $passwordInput.focus();
        }
    };
    
    $btnLogin.addEventListener('click', attemptLogin);
    $passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            attemptLogin();
        }
    });

    $btnLogout.addEventListener('click', () => {
        if (confirm("¿Cerrar sesión de administrador?")) {
            setAdminStatus(false);
        }
    });

    // ------------------------------------------
    // 6. Manejo del Formulario de Producto
    // ------------------------------------------

    $btnNewProduct.addEventListener('click', () => openProductModal());
    $btnCancelProduct.addEventListener('click', closeProductModal);
    $btnSaveProduct.addEventListener('click', handleSaveProduct);
    $sizeButtons.addEventListener('click', handleSizeToggle);

    // ------------------------------------------
    // 7. Manejo del Filtro de Categorías
    // ------------------------------------------

    $categoryFilter.addEventListener('click', (e) => {
        if (e.target.classList.contains('category-btn')) {
            // 1. Eliminar 'active' de todos los botones
            document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));

            // 2. Agregar 'active' al botón clicado
            e.target.classList.add('active');

            // 3. Renderizar productos filtrados
            const category = e.target.dataset.category;
            renderProducts(category);
        }
    });

    // --- Lógica para procesar las dos imágenes (Frente y Dorso) ---
    const setupImageReader = (fileInput, hiddenInput, previewImg) => {
        if (!fileInput) return; 
        fileInput.addEventListener('change', function() {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    // Guardamos el Base64 en el input oculto (Main o Hover)
                    hiddenInput.value = e.target.result;
                    // Mostramos la miniatura en el recuadro correcto
                    previewImg.src = e.target.result;
                    // Hacemos visible el contenedor de previsualización
                    $imagePreviewContainer.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });
    };

    // Aquí activamos la función para los dos botones nuevos que pusimos en el HTML
    setupImageReader($productImageFileMain, $productImageMain, $imagePreviewMain);
    setupImageReader($productImageFileHover, $productImageHover, $imagePreviewHover);

    // ------------------------------------------
    // 8. Inicialización
    // ------------------------------------------

    // Agregar algunos productos de prueba si localStorage está vacío
    if (products.length === 0) {
        products = [
            { id: '1', name: 'Remera Oversize Tokyo', category: 'remeras', price: 15999, stock: 10, sizes: ['M', 'L', 'XL'], image: '' },
            { id: '2', name: 'Buzo Canguro Premium', category: 'buzos', price: 34999, stock: 5, sizes: ['L', 'XL', 'XXL'], image: '' },
            { id: '3', name: 'Campera Bomber Negra', category: 'camperas', price: 49999, stock: 3, sizes: ['M', 'L'], image: '' },
            { id: '4', name: 'Pantalón Cargo Urbano', category: 'pantalones', price: 29999, stock: 8, sizes: ['M', 'L', 'XL'], image: '' }
        ];
        saveProducts();
    }

    renderProducts(); // Renderizar productos al cargar la página
});