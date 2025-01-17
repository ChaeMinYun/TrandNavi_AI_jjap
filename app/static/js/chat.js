console.log("chat.js connection");

// 채팅창 챗봇 로고
const chatbotLogoUrl = $("#chat-messages").data("chatbot-logo");

marked.setOptions({
    breaks: true, // 줄바꿈을 <br>로 변환하도록 설정
});

// 페이지 로드 시 초기 메시지 추가
$(document).ready(function () {
    const initialMessage = "안녕하세요 쇼핑몰 비서 AI서비스 트렌드 네비게이터 입니다.";
    addBotMessage(initialMessage);

    // 파일 선택 버튼 클릭 시 파일 선택 창 열기
    $("#upload-btn").click(function () {
        $("#image-input").click(); // 파일 선택 창을 열기
    });

    // 파일 선택 후 업로드 시작
    $("#image-input").change(function () {
        uploadImage(); // 이미지 업로드 함수 호출
    });
});

// bot chat 생성
function addBotMessage(message) {
    const markedMessage = marked.parse(message);
    const sanitizedMessage = DOMPurify.sanitize(markedMessage);

    // LLM 응답을 그대로 출력
    $("#chat-messages").append(
        `<div class="flex items-start mb-4">
            <img src="${chatbotLogoUrl}" alt="Chatbot Logo" class="mr-2 w-12 h-12 rounded-full">
            <div class="bg-gray-100 p-4 rounded-lg bot-message-content">
                ${sanitizedMessage}
            </div>
        </div>`
    );

    // 스크롤 위치를 맨아래로 이동
    $("#chat-messages").scrollTop($("#chat-messages")[0].scrollHeight);
}

// user chat 생성
function sendMessage() {
    var userMessage = $("#user-input").val();
    if (userMessage.trim() === "") return;
    const token = localStorage.getItem("access_token");

    $("#chat-messages").append(
        `<div class="flex justify-end mb-4">
            <div class="bg-blue-500 text-white p-4 rounded-lg">
                ${userMessage}
            </div>
        </div>`
    );
    $("#user-input").val("");
    $("#chat-messages").scrollTop($("#chat-messages")[0].scrollHeight);

    var botMessageContainer = $(
        `<div class="flex items-start mb-4">
            <img src="${chatbotLogoUrl}" alt="Chatbot Logo" class="mr-2 w-12 h-12 rounded-full">
            <div class="bg-gray-100 p-4 rounded-lg bot-message-content"></div>
        </div>`
    );
    $("#chat-messages").append(botMessageContainer);

    fetch("/chat", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userMessage }),
    }).then((response) => {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        function readStream() {
            reader.read().then(({ done, value }) => {
                if (done) {
                    console.log("Stream complete");

                    // add-to-cart 버튼에 이벤트 리스너 추가
                    botMessageContainer.find('[data-action="add-to-cart"]').each(function () {
                        const productName = $(this).data("product-name");
                        const price = $(this).data("price");
                        const productImg = $(this).data("product-img");
                        const brand = $(this).data("brand");

                        $(this).off("click").on("click", function () {
                            addToCart(productName, price, productImg, brand);
                        });
                    });
                    return;
                }
                
                const chunk = decoder.decode(value);
                const lines = chunk.split("\n");
                lines.forEach((line) => {
                    if (line.startsWith("data: ")) {
                        const data = JSON.parse(line.slice(6));

                        const markedResponse = marked.parse(data.response);
                        const sanitizedResponse = DOMPurify.sanitize(markedResponse);

                        botMessageContainer.find(".bot-message-content").html(sanitizedResponse);
                        $("#chat-messages").scrollTop($("#chat-messages")[0].scrollHeight);
                    }
                });
                readStream();
            });
        }

        readStream();
    });
}

// 이미지 업로드 후 메시지를 보내는 함수
function uploadImage() {
    var fileInput = $("#image-input")[0].files[0];
    if (!fileInput) {
        console.log("파일이 선택되지 않았습니다.");
        return;
    }

    var formData = new FormData();
    formData.append("file", fileInput);

    $("#chat-messages").append(
        `<div class="flex justify-end mb-4">
            <div class="bg-blue-500 text-white p-4 rounded-lg">
                이미지를 업로드 중입니다...
            </div>
        </div>`
    );
    $("#chat-messages").scrollTop($("#chat-messages")[0].scrollHeight);

    var botMessageContainer = $(
        `<div class="flex items-start mb-4">
            <img src="${chatbotLogoUrl}" alt="Chatbot Logo" class="mr-2 w-12 h-12 rounded-full">
            <div class="bg-gray-100 p-4 rounded-lg bot-message-content"></div>
        </div>`
    );
    $("#chat-messages").append(botMessageContainer);

    fetch("/upload", {
        method: "POST",
        body: formData,
    }).then((response) => {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        function readStream() {
            reader.read().then(({ done, value }) => {
                if (done) {
                    console.log("Stream complete");
                    return;
                }
                const chunk = decoder.decode(value);
                const lines = chunk.split("\n");
                lines.forEach((line) => {
                    if (line.startsWith("data: ")) {
                        const data = JSON.parse(line.slice(6));
                        const markedResponse = marked.parse(data.response);
                        const sanitizedResponse = DOMPurify.sanitize(markedResponse);

                        botMessageContainer.find(".bot-message-content").html(sanitizedResponse);
                        $("#chat-messages").scrollTop($("#chat-messages")[0].scrollHeight);
                    }
                });
                readStream();
            });
        }

        readStream();
    });
}

$("#send-button").click(sendMessage);

$("#user-input").keypress(function (e) {
    if (e.which == 13) {
        sendMessage();
        return false;
    }
});

async function addToCart(productName, price, productImg, brand) {
    console.log("Adding to cart:", {
        product_name: productName,
        price: price,
        product_img: productImg,
        product_detail: brand
    });

    try {
        const response = await fetch('/cart', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
            },
            body: JSON.stringify({
                product_name: productName,
                price: price,
                product_img: productImg,
                product_detail: brand
            })
        });

        const result = await response.json();

        if (response.ok) {
            console.log("Server response:", result);
            alert(result.message || "Item added to cart");
        } else {
            console.error("Failed to add item to cart:", result);
            alert(result.error || 'Failed to add item to cart');
        }
    } catch (error) {
        console.error("Error adding to cart:", error);
        alert('An error occurred while adding the item to the cart');
    }
}
