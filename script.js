document.addEventListener("DOMContentLoaded", function() {
    const dateInput = document.getElementById('pickupDate');
    const today = new Date();
    today.setDate(today.getDate() + 5);
    const minDate = today.toISOString().split('T')[0];
    dateInput.min = minDate;
    dateInput.value = minDate; 
});

// 防呆機制：檢查口味是否支援 8 吋或宅配
function checkConstraints() {
    const flavorSelect = document.getElementById('flavor');
    if (flavorSelect.selectedIndex === 0) return;
    
    const selectedOption = flavorSelect.options[flavorSelect.selectedIndex];
    const no8inch = selectedOption.dataset.no8 === "true";
    const noFrozen = selectedOption.dataset.noFrozen === "true";
    
    // 處理 8 吋限制
    const size8Option = document.getElementById('size-8');
    const sizeSelect = document.getElementById('size');
    if (no8inch) {
        size8Option.disabled = true;
        if (sizeSelect.value === "960") {
            alert("不好意思，抹茶/焙茶系列沒辦法做 8 吋喔！幫您重置尺寸。");
            sizeSelect.value = "";
        }
    } else {
        size8Option.disabled = false;
    }

    // 處理宅配限制
    const methodSelect = document.getElementById('method');
    const frozenOption = methodSelect.querySelector('option[value="frozen"]');
    if (noFrozen) {
        frozenOption.disabled = true;
        if (methodSelect.value === "frozen") {
            alert("寒天凍或茶系列在退冰時會影響口感，這款不能冷凍宅配喔！幫您切換回自取。");
            methodSelect.value = "pickup";
            toggleShipping();
        }
    } else {
        frozenOption.disabled = false;
    }
}

function toggleShipping() {
    const method = document.getElementById('method').value;
    
    // 如果選宅配，強迫地區選擇跳到宅配選項並隱藏自取時間
    if (method === 'frozen') {
        document.getElementById('district').value = "250";
        document.getElementById('pickupSection').classList.add('hidden');
        document.getElementById('deliverySection').classList.remove('hidden');
    } else {
        document.getElementById('pickupSection').classList.toggle('hidden', method !== 'pickup');
        document.getElementById('deliverySection').classList.toggle('hidden', method !== 'delivery');
        // 重置地區為中西區避免錯亂
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
        // 免運邏輯 (宅配$250不適用免運)
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
    const datePart = now.getFullYear().toString().slice(-2) + 
                     String(now.getMonth() + 1).padStart(2, '0') + 
                     String(now.getDate()).padStart(2, '0');
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
    
    // 檢查是否有勾選免費餐具，並加註在口味後方
    let flavorText = document.getElementById('flavor').value;
    if (document.getElementById('freeKit').checked) {
        flavorText += " (含免費餐具組)";
    }
    
    let methodText = '自取';
    if (document.getElementById('method').value === 'delivery') methodText = '外送';
    if (document.getElementById('method').value === 'frozen') methodText = '宅配';

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
        address: document.getElementById('method').value === 'pickup' ? '中西區大智街141號(自取)' : document.getElementById('address').value,
        productAmount: document.getElementById('orderForm').dataset.productAmount || 0,
        shippingFee: document.getElementById('shippingDisplay').innerText,
        total: finalTotal
    };

    // 💡 務必替換為妳部署好的 Google Apps Script 網址
    const scriptURL = 'https://script.google.com/macros/s/AKfycbzGWtdrBfje6IZZNzED9iLtj-SE1B9viKqJmtWmUxOR9zRJuN65xGP7LHnTvfpRCRE/exec';

    fetch(scriptURL, { 
        method: 'POST', 
        body: JSON.stringify(formData) 
    })
    .then(res => {
        document.getElementById('orderForm').classList.add('hidden');
        document.getElementById('displayOrderId').innerText = newOrderId;
        document.getElementById('displayOrderTotal').innerText = finalTotal;
        document.getElementById('successSection').classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' }); 
    })
    .catch(error => {
        alert('系統忙碌中，請直接截圖私訊 Line。');
        submitBtn.disabled = false;
        submitBtn.innerText = "建立訂單並前往結帳";
    });
});
