// app.js
document.getElementById("send").addEventListener("click", async () => {
  const field1 = document.getElementById("field1").value;
  const field2 = document.getElementById("field2").value;

  // Простой пример prompt с подстановкой
  const prompt = `Пользователь ввел: ${field1} и ${field2}. Составь подробный ответ.`;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: MODEL, "mistral-7b-instruct"
        input: prompt   // Обязательно поле input, а не messages
      })
    });

    if (!response.ok) {
      throw new Error(`Ошибка API: ${response.status}`);
    }

    const data = await response.json();
    console.log("Ответ OpenRouter:", data);

    // Показать ответ на странице
    alert(data.output || "Нет ответа"); // Обычно OpenRouter возвращает поле output

  } catch (err) {
    console.error("Ошибка запроса:", err);
    alert("Ошибка: " + err.message);
  }
});
