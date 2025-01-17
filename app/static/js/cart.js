// app/static/js/cart.js

function loadCartItems() {
    fetch("/cart_load", {
        method: "GET",
        headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
    })
        .then((response) => {
            console.log("응답 상태 코드:", response.status); // 상태 코드 확인
            if (!response.ok) {
                throw new Error(`서버 응답 오류: ${response.status}`);
            }
            return response.json(); // JSON 파싱 시도
        })
        .then((data) => {
            const cartItemsContainer = document.getElementById("cart-items");
            cartItemsContainer.innerHTML = ""; // 기존 아이템 초기화

            data.forEach((item) => {
                const row = document.createElement("tr");
                row.classList.add("border", "border-gray-300");

                row.innerHTML = `
                <td class="py-4 px-6 border-b">
                    <div class="flex items-center">
                        <img src="${
                            item.product_img ||
                            "https://via.placeholder.com/100"
                        }" alt="Product Image" class="w-16 h-16 rounded-md mr-4">
                        <div>
                            <h3 class="text-lg font-medium text-gray-700">${
                                item.product_name
                            }</h3>
                        </div>
                    </div>
                </td>
                <td class="py-4 px-6 border-b text-lg font-semibold text-gray-700">₩ ${item.price.toLocaleString()}</td>
                <td class="py-4 px-6 border-b text-gray-700">${
                    item.product_detail.description
                }</td>
                <td class="py-4 px-6 border-b text-gray-700">${new Date(
                    item.add_at
                ).toLocaleDateString()}</td>
                <td class="py-4 px-6 border-b">
                    <div class="flex flex-col space-y-2">
                        <button class="px-2 py-2 bg-blue-500 text-white rounded hover:bg-blue-600" style="max-width: 100px;">바로 구매</button>
                        <button class="px-2 py-2 bg-red-500 text-white rounded hover:bg-red-600" style="max-width: 100px;" onclick="removeItem(${
                            item.id
                        })">삭제</button>
                    </div>
                </td>
            `;

                cartItemsContainer.appendChild(row);
            });
        })
        .catch((error) => {
            console.error("장바구니 데이터를 불러오는 중 오류 발생:", error);
        });
}

// 아이템 삭제 함수
function removeItem(itemId) {
    // 아이템 삭제 로직 작성
    console.log("아이템 삭제:", itemId);
}

// 페이지 로드 시 장바구니 아이템을 불러옵니다.
// document.addEventListener("DOMContentLoaded", loadCartItems);
