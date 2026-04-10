let originalSize8Option = null;
let originalFrozenOption = null;

document.addEventListener("DOMContentLoaded", function() {
    const dateInput = document.getElementById('pickupDate');
    const today = new Date();
    today.setDate(today.getDate() + 5);
    const minDate = today.toISOString().split('T')[0];
    dateInput.min = minDate;
    dateInput.value = minDate; 
    
    // 初始化時存好備用選項
    originalSize8Option = document.getElementById('size-8');
    originalFrozenOption = document.querySelector('option[value="frozen"]');
});

// 口味變動主控制
function handleFlavorChange() {
    checkConstraints();
    updateImagePreview();
    updateTotal();
}

// 📸 根據口味序號顯示對應照片
function updateImagePreview() {
    const flavorSelect = document.getElementById('flavor');
    const previewBox = document.getElementById('flavorPreviewBox');
    const previewImg = document.getElementById('flavorPreviewImg');

    if (flavorSelect.selectedIndex === 0) {
        previewBox.classList.add('hidden');
    } else {
        // 抓取選項索引值作為檔名 (1-14)
        let idx = flavorSelect.selectedIndex;
        previewImg.src = 'cake-' + idx + '.jpg';
        previewBox.classList.remove('hidden');
    }
}

// 霸道防呆：直接拔除不符合的選項
function checkConstraints() {
    const flavorSelect = document.getElementById('flavor');
    if (flavorSelect.selectedIndex === 0) return;
    
    const selectedOption = flavorSelect.options[flavorSelect.selectedIndex];
    const no8inch = selectedOption.dataset.no8 === "true";
    const noFrozen = selectedOption.dataset.noFrozen === "true";
    
    const sizeSelect = document.getElementById('size');
    const methodSelect = document.getElementById('method');

    // 處理 8 吋
    if (no8inch) {
        if (document.getElementById('size-8')) document.getElementById('size-8').remove();
        if (sizeSelect.value === "960") sizeSelect.value = ""; 
    } else {
        if (!document.getElementById('size-8')) sizeSelect.appendChild(originalSize8Option);
    }

    // 處理宅配
    const currentFrozen = methodSelect.querySelector('option[value="frozen"]');
    if (noFrozen) {
        if (currentFrozen) currentFrozen.remove();
        if (methodSelect.value === "frozen") {
            methodSelect.value = "pickup";
            toggleShipping(); 
        }
    } else {
        if (!currentFrozen) methodSelect.appendChild(originalFrozenOption);
    }
}

function toggleShipping() {
    const method = document.getElementById('method').value;
    if (method === 'frozen') {
        document.getElementById('district').value = "250";
        document.getElementById('pickupSection').classList.add('hidden');
        document.getElementById('deliverySection').classList.remove('hidden');
    } else {
        document.getElementById('pickupSection').classList.toggle('hidden', method !== 'pickup');
        document.getElementById('deliverySection').classList.toggle('hidden', method !== 'delivery');
        if (method === 'pickup') {
            document.getElementById('address').value = '';
            document.getElementById('district').value = "0";
        }
    }
    updateTotal();
}

function updateTotal() {
    const basePrice = parseInt(document.getElementById('size').value) || 0;
    const method = document.getElementById('method').value;
    let shipping = 0;

    if (method === 'delivery' || method === 'frozen') {
        shipping = parseInt(document.getElementById('district').value);
        if (shipping === 60 && basePrice >= 1000) shipping = 0;
        if (shipping === 120 && basePrice >= 1500) shipping = 0;
    }

    const addon1 = document.getElementById('candle').checked ? 5 : 0;
    const addon2 = document.getElementById('cutlery').checked ? 10 : 0;
    
    const productAmount = basePrice + addon1 + addon2;
    const total = productAmount + shipping;

    document.getElementById('shippingDisplay').innerText = shipping;
    document.getElementById('totalDisplay').innerText = total;
    document.getElementById('orderForm').dataset.productAmount = productAmount; 
}

function generateOrderId() {
    const now = new Date();
    const datePart = now.getFullYear().toString().slice(-2) + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0');
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `DM${datePart}-${randomPart}`;
}

document.getElementById('orderForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.innerText = "訂單連線中...";
    submitBtn.disabled = true;

    const sizeSelect = document.getElementById('size');
    const sizeText = sizeSelect.options[sizeSelect.selectedIndex].text;
    
    let flavorText = document.getElementById('flavor').value;
    if (document.getElementById('freeKit').checked) flavorText += " (含免費餐具組)";
    
    let methodText = document.getElementById('method').value === 'pickup' ? '自取' : (document.getElementById('method').value === 'frozen' ? '宅配' : '外送');

    const newOrderId = generateOrderId();
    const finalTotal = document.getElementById('totalDisplay').innerText;

    const formData = {
        action: "createOrder",
        orderId: newOrderId,
        orderDate: new Date().toLocaleDateString('zh-TW'),
        pickupDate: document.getElementById('pickupDate').value,
        pickupTime: document.getElementById('method').value === 'pickup' ? document.getElementById('pickupTime').value : '無',
        method: methodText,
        flavor: flavorText,
        size: sizeText,
        name: document.getElementById('name').value,
        phone: document.getElementById('phone').value,
        address: document.getElementById('method').value === 'pickup' ? '自取' : document.getElementById('address').value,
        productAmount: document.getElementById('orderForm').dataset.productAmount || 0,
        shippingFee: document.getElementById('shippingDisplay').innerText,
        total: finalTotal
    };

    const scriptURL = 'https://script.google.com/macros/s/AKfycbzYYDZBok2sTcHpBOzwIXRvTs511o3vS79zEeYQAa8o7msQGRR_e83RlepveH8AnVgZ/exec';

    fetch(scriptURL, { method: 'POST', body: JSON.stringify(formData) })
    .then(res => {
        document.getElementById('orderForm').classList.add('hidden');
        document.getElementById('displayOrderId').innerText = newOrderId;
        document.getElementById('displayOrderTotal').innerText = finalTotal;
        document.getElementById('successSection').classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' }); 
    })
    .catch(error => {
        alert('系統忙碌中，請聯繫豆媽。');
        submitBtn.disabled = false;
        submitBtn.innerText = "建立訂單並前往結帳";
    });
});
