let originalSize8Option = null;
let originalFrozenOption = null;

document.addEventListener("DOMContentLoaded", function() {
    const dateInput = document.getElementById('pickupDate');
    const today = new Date();
    today.setDate(today.getDate() + 5);
    dateInput.min = today.toISOString().split('T')[0];
    dateInput.value = today.toISOString().split('T')[0];
    
    // 預存 8 吋和宅配選項，方便之後拔掉與裝回
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

    // 強勢處理 8 吋：如果不能做就直接從 DOM 移除
    if (no8inch) {
        if (document.getElementById('size-8')) {
            document.getElementById('size-8').remove();
        }
        if (sizeSelect.value === "960") {
            alert("不好意思，此款口味無法製作 8 吋，請重新選擇尺寸喔。");
            sizeSelect.value = ""; 
            updateTotal();
        }
    } else {
        // 如果原本被拔掉，現在要裝回來
        if (!document.getElementById('size-8')) {
            sizeSelect.appendChild(originalSize8Option);
        }
    }

    // 強勢處理宅配：如果不能寄就直接從 DOM 移除
    const currentFrozen = document.getElementById('frozen-option');
    if (noFrozen) {
        if (currentFrozen) {
            currentFrozen.remove();
        }
        if (methodSelect.value === "frozen") {
            alert("寒天凍/茶系列建議自取以維持口感，此款不支援宅配喔，幫您切換回自取。");
            methodSelect.value = "pickup";
            toggleShipping(); 
        }
    } else {
        // 如果原本被拔掉，現在要裝回來
        if (!document.getElementById('frozen-option')) {
            methodSelect.appendChild(originalFrozenOption);
        }
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
        total: document.getElementById('totalDisplay').innerText
    };

    // 💡 這裡換成妳部署好的 Google Apps Script URL
    const scriptURL = 'https://script.google.com/macros/s/AKfycbzYYDZBok2sTcHpBOzwIXRvTs511o3vS79zEeYQAa8o7msQGRR_e83RlepveH8AnVgZ/exec';

    fetch(scriptURL, { method: 'POST', body: JSON.stringify(formData) })
    .then(() => {
        document.getElementById('orderForm').classList.add('hidden');
        document.getElementById('displayOrderId').innerText = newOrderId;
        document.getElementById('displayOrderTotal').innerText = document.getElementById('totalDisplay').innerText;
        document.getElementById('successSection').classList.remove('hidden');
        window.scrollTo(0, 0); 
    })
    .catch(() => {
        alert('系統忙碌中，請聯繫豆媽。');
        submitBtn.disabled = false;
        submitBtn.innerText = "建立訂單並前往結帳";
    });
});
