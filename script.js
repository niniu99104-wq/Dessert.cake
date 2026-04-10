let originalSize8Option = null;
let originalFrozenOption = null;

const offDays = [
    "2026-04-12", "2026-04-18", "2026-04-19", "2026-04-20", 
    "2026-04-25", "2026-04-26", "2026-04-27"
];

document.addEventListener("DOMContentLoaded", function() {
    const dateInput = document.getElementById('pickupDate');
    const today = new Date();
    const minDate = new Date();
    minDate.setDate(today.getDate() + 5);
    dateInput.min = minDate.toISOString().split('T')[0];
    dateInput.value = minDate.toISOString().split('T')[0];
    
    let maxDate = new Date(today.getFullYear(), today.getMonth() + 1, 0); 
    if (today.getDate() >= 15) {
        maxDate = new Date(today.getFullYear(), today.getMonth() + 2, 0);
    }
    dateInput.max = maxDate.toISOString().split('T')[0];
    
    originalSize8Option = document.getElementById('size-8');
    originalFrozenOption = document.getElementById('frozen-option');
    validateDate();
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
    const no8inch = selectedOption.getAttribute("data-no-8") === "true";
    const noFrozen = selectedOption.getAttribute("data-no-frozen") === "true";
    const sizeSelect = document.getElementById('size');
    const methodSelect = document.getElementById('method');

    if (no8inch) {
        if (document.getElementById('size-8')) document.getElementById('size-8').remove();
        if (sizeSelect.value === "960") { sizeSelect.value = ""; updateTotal(); }
    } else {
        if (!document.getElementById('size-8')) sizeSelect.appendChild(originalSize8Option);
    }

    if (noFrozen) {
        if (document.getElementById('frozen-option')) document.getElementById('frozen-option').remove();
        if (methodSelect.value === "frozen") { methodSelect.value = "pickup"; toggleShipping(); }
    } else {
        if (!document.getElementById('frozen-option')) methodSelect.appendChild(originalFrozenOption);
    }
}

function validateDate() {
    const dateInput = document.getElementById('pickupDate');
    const methodSelect = document.getElementById('method');
    const selectedDateStr = dateInput.value;
    if (!selectedDateStr) return;
    const selectedDate = new Date(selectedDateStr);
    const dayOfWeek = selectedDate.getDay(); 

    if (offDays.includes(selectedDateStr)) {
        alert("這天店休喔，請選擇其他日期，謝謝！");
        dateInput.value = dateInput.min;
        return;
    }
    if (methodSelect.value === 'frozen' && (dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0)) {
        alert("宅配週五六日不收件也不配送喔！");
        dateInput.value = ""; 
    }
}

function toggleShipping() {
    const method = document.getElementById('method').value;
    if (method === 'frozen') {
        document.getElementById('district').value = "250";
        document.getElementById('pickupSection').classList.add('hidden');
        document.getElementById('deliverySection').classList.remove('hidden');
        validateDate();
    } else {
        document.getElementById('pickupSection').classList.toggle('hidden', method !== 'pickup');
        document.getElementById('deliverySection').classList.toggle('hidden', method !== 'delivery');
        if (method === 'pickup') { document.getElementById('address').value = ''; document.getElementById('district').value = "0"; }
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
    document.getElementById('orderForm').setAttribute('data-product-amount', basePrice + addon1 + addon2);
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
        productAmount: document.getElementById('orderForm').getAttribute('data-product-amount') || 0,
        shippingFee: document.getElementById('shippingDisplay').innerText,
        total: finalTotal
    };

    fetch('https://script.google.com/macros/s/AKfycbzYYDZBok2sTcHpBOzwIXRvTs511o3vS79zEeYQAa8o7msQGRR_e83RlepveH8AnVgZ/exec', { method: 'POST', body: JSON.stringify(formData) })
    .then(() => {
        document.getElementById('orderForm').classList.add('hidden');
        document.getElementById('displayOrderId').innerText = newOrderId;
        document.getElementById('displayOrderTotal').innerText = finalTotal;
        document.getElementById('successSection').classList.remove('hidden');
        window.scrollTo(0, 0); 
    })
    .catch(() => {
        alert('連線忙碌中，請直接聯繫香草籽粉專。');
        submitBtn.disabled = false;
        submitBtn.innerText = "建立訂單並前往結帳";
    });
});
