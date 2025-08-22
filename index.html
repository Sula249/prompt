// === ОТПРАВКА ДАННЫХ ===
document.getElementById("send").addEventListener("click", async () => {
  const field1 = document.getElementById("field1").value;
  const field2 = document.getElementById("field2").value;

  if (!field1 && !field2) {
    alert("Введите хотя бы одно значение!");
    return;
  }

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
        input: prompt   // OpenRouter ожидает поле "input", а не "messages"
      })
    });

    if (!response.ok) {
      throw new Error(`Ошибка API: ${response.status}`);
    }

    const data = await response.json();
    console.log("Ответ OpenRouter:", data);

    // Чаще всего OpenRouter возвращает текст в data.output или data.output_text
    let text = "";
    if (Array.isArray(data.output) && data.output.length > 0) {
      text = data.output[0].content || data.output[0].text || JSON.stringify(data.output[0]);
    } else if (data.output_text) {
      text = data.output_text;
    } else {
      text = "Нет ответа от модели";
    }

    // Добавим вывод на страницу внизу формы
    let resultDiv = document.getElementById("result");
    if (!resultDiv) {
      resultDiv = document.createElement("div");
      resultDiv.id = "result";
      resultDiv.style.marginTop = "12px";
      document.body.appendChild(resultDiv);
    }
    resultDiv.textContent = text;

  } catch (err) {
    console.error("Ошибка запроса:", err);
    let resultDiv = document.getElementById("result");
    if (!resultDiv) {
      resultDiv = document.createElement("div");
      resultDiv.id = "result";
      resultDiv.style.marginTop = "12px";
      document.body.appendChild(resultDiv);
    }
    resultDiv.textContent = "Ошибка: " + err.message;
  }
});
