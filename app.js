// app.js

// === НАСТРОЙКИ API ===
const API_KEY = "ВСТАВЬ_СЮДА_СВОЙ_API_KEY"; // Получи свой API ключ на https://openrouter.ai/keys
const API_URL = "https://openrouter.ai/api/v1/completions"; // Это стандартный URL для OpenRouter
const MODEL = "mistral-7b-instruct"; // Убедись, что эта модель доступна в твоём аккаунте

// === ОТПРАВКА ДАННЫХ ===
document.getElementById("send").addEventListener("click", async () => {
  const field1 = document.getElementById("field1").value;
  const field2 = document.getElementById("field2").value;

  // Простой prompt с подстановкой
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
        prompt: prompt // Используем поле prompt, а не input
      })
    });

    if (!response.ok) {
      throw new Error(`Ошибка API: ${response.status}`);
    }

    const data = await response.json();
    console.log("Ответ OpenRouter:", data);

    // Показать ответ на странице
    alert(data.choices?.[0]?.text || "Нет ответа");

  } catch (err) {
    console.error("Ошибка запроса:", err);
    alert("Ошибка: " + err.message);
  }
});
