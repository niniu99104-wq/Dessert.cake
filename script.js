let originalSize8Option = null;
let originalFrozenOption = null;

document.addEventListener("DOMContentLoaded", function() {
    // 設定日期限制
    const dateInput = document.getElementById('pickupDate');
    const today = new Date();
    today.setDate(today.getDate() + 5);
    dateInput.min = today.toISOString().split('T')[0];
    dateInput.value = today.toISOString().split('T')[0];
    
    // 預存選項備用
    originalSize8Option = document.getElementById('size-8');
    originalFrozenOption = document.getElementById('frozen-option');
});

function handleFlavorChange() {
    checkConstraints();
    updateImagePreview();
    updateTotal();
}

function updateImagePreview() {
    const flavorSelect = document.getElementById('flavor');
    const previewBox = document.getElementById('flavorPreviewBox');
    const previewImg = document.getElementById('flavorPreviewImg');

    if (flavorSelect.selectedIndex === 0) {
        previewBox.classList.add('hidden');
    } else {
        // 直接對應 cake-1.jpg ~ cake-14.jpg
        previewImg.src = 'cake-' + flavorSelect.selectedIndex + '.jpg';
        previewBox.classList.remove('hidden');
    }
}

function checkConstraints() {
    const flavorSelect = document.getElementById('flavor');
    if (flavorSelect.selectedIndex === 0) return;
    
    const selectedOption = flavorSelect.options[flavorSelect.selectedIndex];
    const no8inch = selectedOption.dataset.no8 === "true";
    const noFrozen = selectedOption.dataset.noFrozen === "true";
    
    const sizeSelect = document.getElementById('size');
    const methodSelect = document.getElementById('method');

    if (no8inch) {
        if (document.getElementById('size-8')) document.getElementById('size-8').remove();
        if (sizeSelect.value === "960") sizeSelect.value = ""; 
    } else {
        if (!document.getElementById('size-8')) sizeSelect.appendChild(originalSize8Option);
    }

    const currentFrozen = document.getElementById('frozen-option');
    if (noFrozen) {
        if (currentFrozen) currentFrozen.remove();
        if (methodSelect.value === "frozen") {
            methodSelect.value = "pickup";
            toggleShipping(); 
        }
    } else {
        if (!document.getElementById('frozen-option')) methodSelect.appendChild(originalFrozenOption);
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
    
    const total = basePrice + addon1 + addon2 + shipping;
    document.getElementById('shippingDisplay').innerText = shipping;
    document.getElementById('totalDisplay').innerText = total;
    document.getElementById('orderForm').dataset.productAmount = basePrice + addon1 + addon2;
}

function generateOrderId() {
    const now = new Date();
    const datePart = now.getFullYear().toString().slice(-2) + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0');
    return `DM${datePart}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}

document.getElementById('orderForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.innerText = "連線中...";
    submitBtn.disabled = true;

    const newOrderId = generateOrderId();
    const finalTotal = document.getElementById('totalDisplay').innerText;
    
    let addonsList = [];
    if (document.getElementById('candle').checked) addonsList.push("加購小蠟燭");
    if (document.getElementById('cutlery').checked) addonsList.push("加購餐具組");

    const formData = {
        action: "createOrder",
        orderId: newOrderId,
        orderDate: new Date().toLocaleDateString('zh-TW'),
        pickupDate: document.getElementById('pickupDate').value,
        pickupTime: document.getElementById('method').value === 'pickup' ? document.getElementById('pickupTime').value : '無',
        method: document.getElementById('method').value === 'pickup' ? '自取' : (document.getElementById('method').value === 'frozen' ? '宅配' : '外送'),
        flavor: document.getElementById('flavor').value,
        size: document.getElementById('size').options[document.getElementById('size').selectedIndex].text,
        name: document.getElementById('name').value,
        phone: document.getElementById('phone').value,
        address: document.getElementById('method').value === 'pickup' ? '自取' : document.getElementById('address').value,
        freeKit: document.getElementById('freeKit').checked ? '是' : '否',
        addons: addonsList.join('、') || '無',
        productAmount: document.getElementById('orderForm').dataset.productAmount,
        shippingFee: document.getElementById('shippingDisplay').innerText,
        total: finalTotal
    };

    const scriptURL = 'YOUR_GOOGLE_APPS_SCRIPT_URL';

    fetch(scriptURL, { method: 'POST', body: JSON.stringify(formData) })
    .then(() => {
        document.getElementById('orderForm').classList.add('hidden');
        document.getElementById('displayOrderId').innerText = newOrderId;
        document.getElementById('displayOrderTotal').innerText = finalTotal;
        document.getElementById('successSection').classList.remove('hidden');
        window.scrollTo(0, 0); 
    })
    .catch(() => {
        alert('系統忙碌中，請聯繫豆媽。');
        submitBtn.disabled = false;
        submitBtn.innerText = "建立訂單並前往結帳";
    });
});
