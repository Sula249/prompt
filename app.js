// app.js

// === НАСТРОЙКИ API ===
const API_KEY = "ВСТАВЬ_СЮДА_СВОЙ_API_KEY"; 
const API_URL = "https://api.openrouter.ai/v1/completions"; // стандартный URL OpenRouter
const MODEL = "mistral-7b-instruct"; // заменяешь на любую модель OpenRouter, если нужно

// === ОТПРАВКА ДАННЫХ ===
document.getElementById("send").addEventListener("click", async () => {
  const field1 = document.getElementById("field1").value;
  const field2 = document.getElementById("field2").value;

  // простой prompt с подстановкой
  const prompt = `Пользователь ввел: ${field1} и ${field2}. Составь ответ максимально подробно.`;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: MODEL,
        input: prompt
      })
    });

    if (!response.ok) {
      throw new Error(`Ошибка API: ${response.status}`);
    }

    const data = await response.json();
    console.log("Ответ OpenRouter:", data);

    // выводим результат на странице
    alert(data.output || "Нет ответа");

  } catch (err) {
    console.error("Ошибка запроса:", err);
    alert("Ошибка: " + err.message);
  }
});
