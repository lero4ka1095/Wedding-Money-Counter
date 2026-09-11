# Wedding Money Counter

Две связанные realtime-страницы:

- `/admin/` — добавление денег за мальчика/девочку, история, отмена записи, полный сброс.
- `/screen/` — полноэкранное табло, которое автоматически обновляется без перезагрузки.

## 1. Создать Firebase

1. Откройте https://console.firebase.google.com/
2. Create project.
3. В проекте: **Build → Realtime Database → Create Database**.
4. Выберите регион и создайте базу.
5. В **Realtime Database → Rules** вставьте содержимое файла `database.rules.json` и нажмите Publish.
6. В **Project settings → General → Your apps** добавьте Web app.
7. Скопируйте `firebaseConfig`.
8. Откройте `firebase.js` и замените все `PASTE_ME` реальными значениями.
   Убедитесь, что в конфиге есть `databaseURL`.

## 2. Запустить локально

Из папки проекта:

```bash
python3 -m http.server 8080
```

Открыть:

- http://localhost:8080/admin/
- http://localhost:8080/screen/

Не открывайте HTML двойным кликом через `file://` — browser modules удобнее запускать через HTTP.

## 3. Бесплатно опубликовать

Подойдут Cloudflare Pages, Firebase Hosting, Netlify или Vercel.

Самый простой вариант без сборки:
- положить эту папку в GitHub;
- подключить репозиторий к Cloudflare Pages;
- build command оставить пустым;
- output directory: `/` (или корень проекта, в зависимости от интерфейса).

## Данные

Каждое внесение хранится отдельно:

```json
{
  "payments": {
    "-generated-id": {
      "side": "boy",
      "amount": 2000,
      "createdAt": 1234567890
    }
  }
}
```

Итог считается на клиентах из списка внесений. Поэтому удаление одной ошибочной записи автоматически корректирует оба экрана.

## Важно про безопасность

`database.rules.json` специально максимально простой для разовой свадьбы: читать и записывать может любой, кто знает адрес Firebase database/API.

Для публичного постоянного сайта лучше включить Firebase Authentication и разрешить запись только администратору. Для мероприятия можно хотя бы не публиковать `/admin/` гостям, но это не является настоящей защитой.
