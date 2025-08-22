// app.js
import { API_KEY, API_URL, MODEL } from './config.js';

document.getElementById("send").addEventListener("click", async () => {
  const field1 = document.getElementById("field1").value;
  const field2 = document.getElementById("field2").value;

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
        input: prompt   // В OpenRouter для Mistral используется поле `input`
      })
    });

    if (!response.ok) {
      throw new Error(`Ошибка API: ${response.status}`);
    }

    const data = await response.json();
    console.log("Ответ OpenRouter:", data);

    // Показать ответ на странице
    alert(data.output || "Нет ответа"); // OpenRouter возвращает поле output

  } catch (err) {
    console.error("Ошибка запроса:", err);
    alert("Ошибка: " + err.message);
  }
});
