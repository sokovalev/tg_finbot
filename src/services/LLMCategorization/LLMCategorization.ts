import OpenAI from "openai";
import { env } from "../../lib/env";
import fewShotExamples from "./fewShotExamples.json";
import jsonSchema from "./jsonSchema.json";

const systemPrompt = `Роль: Строгий классификатор транзакций.
Задача: Выбрать категорию и вернуть сумму КАК ЕСТЬ (без конвертации валют).

ПРАВИЛА (Сверху вниз):

1. ЖИВОТНЫЕ (Приоритет №1):
   - Корм/Вискас/Наполнитель/Ветклиника/Игрушка собаке -> "Питомцы"

2. ДЕТИ (Приоритет №2):
   - Памперсы/Садик/Школа/Детская одежда/Игрушки (своим) -> "Дети"

3. АЛКОГОЛЬ И ТАБАК:
   - Пиво/Вино/Водка/Сигареты/Стики/Вейп -> "Алкоголь и табак" (Даже если куплено с едой!)

4. ПОДАРКИ:
   - Цветы/Подарок/Лего (племяннику) -> "Подарки"
   - Фонд/Пожертвование -> "Благотворительность"

5. АВТОМОБИЛЬ:
   - Бензин/АЗС -> "Автомобиль: Топливо"
   - Мойка/Шиномонтаж/ТО/Парковка/Штраф ГИБДД -> "Автомобиль: Обслуживание"
   - Такси/Uber/Яндекс -> "Такси/Каршеринг"

6. ЕДА:
   - Доставка/Яндекс.Еда -> "Доставка еды"
   - Кафе/Фастфуд/Кофе/Столовая/Торт (готовый) -> "Кафе и рестораны"
   - Продукты/Вода (бутылка)/Масло/Соль -> "Продукты"

7. ДОМ И БЫТ:
   - Аренда -> "Аренда жилья"
   - ЖКХ/Свет -> "ЖКУ и счета"
   - Мебель/Ремонт/Обои/Кран -> "Ремонт и мебель"
   - Химия/Посуда/Дрова/Семена -> "Товары для дома"

8. ОДЕЖДА И ВЕЩИ:
   - Одежда/Обувь/Рюкзак/Чемодан/Ремонт обуви -> "Одежда и обувь"
   - Телефон/Наушники/Гаджеты -> "Техника и электроника"
   - Шампунь/Мыло/Косметика -> "Красота и уход"

9. ДОСУГ И СПОРТ:
   - Фитнес/Бассейн/Велик/Лыжи -> "Спорт"
   - Кино/Игры/Сауна/Удочка/Боулинг -> "Развлечения"
   - Отель/Билет на самолет/Тур/Палатка/Спальник -> "Путешествия и отели"

10. УСЛУГИ:
    - Врач/Аптека/Анализы -> "Медицина и лекарства"
    - Интернет/Связь/Телефон (оплата) -> "Интернет и связь"
    - Подписка/VPN/Юрист -> "Подписки и сервисы"
    - Кредит/Ипотека/Долг -> "Кредиты и долги"
    - Инвестиции/Обмен валюты/Вклад -> "Инвестиции"
`;

const FOLDER_ID = "b1g1nd51355663ndo3mk";

const client = new OpenAI({
  apiKey: env.YANDEX_CLOUD_API_KEY,
  baseURL: "https://rest-assistant.api.cloud.yandex.net/v1",
  project: FOLDER_ID,
});

export async function LLMCategorizeExpense(message: string) {
  try {
    const response = await client.responses.create({
      model: `gpt://${FOLDER_ID}/yandexgpt-lite/latest`,
      instructions: systemPrompt,
      input: [
        ...fewShotExamples.map((ex) => ({
          role: ex.role as "user" | "assistant",
          content: ex.text,
        })),
        { role: "user" as const, content: message },
      ],
      text: {
        format: {
          type: "json_schema" as const,
          ...jsonSchema,
        },
      },
      temperature: 0,
    });

    const content = response.output_text;

    if (!content) {
      console.warn("Empty response content", response);
      return null;
    }

    try {
      const parsed = JSON.parse(content);
      return parsed;
    } catch (e) {
      console.error("Failed to parse JSON response:", content);
      console.error(message);
      return null;
    }
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      console.error("API Error:", error.message, error.status);
    } else {
      console.error("Error:", error);
    }
    return null;
  }
}

// Тест
LLMCategorizeExpense("Купил продукты на 1500");
