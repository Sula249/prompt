document.getElementById("send").addEventListener("click", async () => {
  const field1 = document.getElementById("field1").value;
  const field2 = document.getElementById("field2").value;
  const sendBtn = document.getElementById("send");
  const resultDiv = document.getElementById("result");

  if (!field1 && !field2) {
    alert("Введите хотя бы одно значение!");
    return;
  }

  const prompt = `Пользователь ввел: ${field1} и ${field2}. Составь ответ максимально подробно.`;

  // === Блокировка кнопки + спиннер ===
  sendBtn.disabled = true;
  sendBtn.innerHTML = `<span class="spinner"></span> Обработка...`;
  resultDiv.textContent = "Загрузка...";

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: prompt }]
      })
    });

    if (!response.ok) {
      throw new Error(`Ошибка API: ${response.status}`);
    }

    const data = await response.json();
    console.log("Ответ OpenRouter:", data);

    let text = "";
    if (Array.isArray(data.choices) && data.choices.length > 0) {
      text = data.choices[0].message.content || "Нет ответа от модели";
    } else {
      text = "Нет ответа от модели";
    }

    resultDiv.textContent = text;

  } catch (err) {
    console.error("Ошибка запроса:", err);
    resultDiv.textContent = "Ошибка: " + err.message;
  } finally {
    // === Возврат кнопки в исходное состояние ===
    sendBtn.disabled = false;
    sendBtn.textContent = "Отправить";
  }
});
