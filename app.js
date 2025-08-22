// app.js
document.getElementById("send").addEventListener("click", async () => {
  const field1 = document.getElementById("field1").value;
  const field2 = document.getElementById("field2").value;

  // 🔑 Собираем простой prompt
  const prompt = `Пользователь ввёл: "${field1}" и "${field2}". Составь подробный ответ.`;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: MODEL,    // Точно имя модели из OpenRouter, например "mistral-7b-instruct"
        input: prompt    // Для OpenRouter поле называется input, не messages
      })
    });

    if (!response.ok) {
      throw new Error(`Ошибка API: ${response.status}`);
    }

    const data = await response.json();
    console.log("Ответ OpenRouter:", data);

    // Чаще всего OpenRouter возвращает output
    alert(data.output || "Нет ответа");

  } catch (err) {
    console.error("Ошибка запроса:", err);
    alert("Ошибка: " + err.message);
  }
});
