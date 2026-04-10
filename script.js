document.addEventListener("DOMContentLoaded", function() {
    const dateInput = document.getElementById('pickupDate');
    const today = new Date();
    today.setDate(today.getDate() + 5);
    const minDate = today.toISOString().split('T')[0];
    dateInput.min = minDate;
    dateInput.value = minDate; 
});

function toggleShipping() {
    const method = document.getElementById('method').value;
    document.getElementById('pickupSection').classList.toggle('hidden', method !== 'pickup');
    document.getElementById('deliverySection').classList.toggle('hidden', method !== 'delivery');
    if (method === 'pickup') document.getElementById('address').value = '';
    updateTotal();
}

function updateTotal() {
    const basePrice = parseInt(document.getElementById('size').value) || 0;
    const method = document.getElementById('method').value;
    let shipping = 0;

    if (method === 'delivery') {
        shipping = parseInt(document.getElementById('district').value);
        if (shipping === 60 && basePrice >= 1000) shipping = 0;
        if (shipping === 120 && basePrice >= 1500) shipping = 0;
    }

    const addon1 = document.getElementById('candle').checked ? 10 : 0;
    const addon2 = document.getElementById('cutlery').checked ? 20 : 0;
    
    const productAmount = basePrice + addon1 + addon2;
    const total = productAmount + shipping;

    document.getElementById('shippingDisplay').innerText = shipping;
    document.getElementById('totalDisplay').innerText = total;
    document.getElementById('orderForm').dataset.productAmount = productAmount; 
}

// 產生專屬訂單編號 (例如：DM260410-XY01)
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
    
    const newOrderId = generateOrderId();
    const finalTotal = document.getElementById('totalDisplay').innerText;

    // 準備傳送給 Google 試算表的資料 (帶有 action: createOrder)
    const formData = {
        action: "createOrder",
        orderId: newOrderId,
        orderDate: new Date().toLocaleDateString('zh-TW'),
        pickupDate: document.getElementById('pickupDate').value,
        pickupTime: document.getElementById('method').value === 'pickup' ? document.getElementById('pickupTime').value : '無',
        method: document.getElementById('method').value === 'pickup' ? '自取' : '外送',
        flavor: document.getElementById('flavor').value,
        size: sizeText,
        name: document.getElementById('name').value,
        phone: document.getElementById('phone').value,
        address: document.getElementById('method').value === 'pickup' ? '中西區大智街141號(自取)' : document.getElementById('address').value,
        productAmount: document.getElementById('orderForm').dataset.productAmount || 0,
        shippingFee: document.getElementById('shippingDisplay').innerText,
        total: finalTotal
    };

    // 💡 務必替換為妳部署好的 Google Apps Script 網址
    const scriptURL = 'YOUR_GOOGLE_APPS_SCRIPT_URL';

    fetch(scriptURL, { 
        method: 'POST', 
        body: JSON.stringify(formData) 
    })
    .then(res => {
        // 成功寫入試算表後，切換到結帳引導畫面
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
