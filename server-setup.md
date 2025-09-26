## Структура файлов на сервере

```
/opt/yandex2mqtt/
├── config.js                     # Файл конфигурации устройств
└── y2manager/                    # Веб-приложение
    ├── client/                   # Frontend файлы
    ├── server/                   # Backend файлы
    ├── shared/                   # Общие схемы
    ├── package.json              # Зависимости
    ├── install.sh                # Скрипт установки
    └── README.md                 # Документация
```

## Быстрая установка

1. **Распакуйте архив в директорию:**
   ```bash
   sudo mkdir -p /opt/yandex2mqtt/y2manager
   cd /opt/yandex2mqtt/y2manager
   unzip y2manager.zip
   ```

2. **Запустите скрипт установки:**
   ```bash
   chmod +x install.sh
   ./install.sh
   ```

3. **Скопируйте ваш существующий config.js:**
   ```bash
   sudo cp /путь/к/вашему/config.js /opt/yandex2mqtt/config.js
   ```

4. **Запустите приложение:**
   ```bash
   npm run dev
   ```

## Ручная установка

### 1. Установка Node.js (если не установлен)
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL
sudo yum install nodejs npm
```

### 2. Настройка директорий
```bash
sudo mkdir -p /opt/yandex2mqtt/y2manager
sudo chown -R $USER:$USER /opt/yandex2mqtt
```

### 3. Установка зависимостей
```bash
cd /opt/yandex2mqtt/y2manager
npm install
```

### 4. Запуск в разработке
```bash
npm run dev
```
Приложение будет доступно на http://ip:8082

### 5. Запуск в продакшене
```bash
npm run build
npm run start
```

## Настройка как системной службы

Создайте файл службы:
```bash
sudo nano /etc/systemd/system/y2manager.service
```

Содержимое файла:
```ini
[Unit]
Description=y2m config manager
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/opt/yandex2mqtt/y2manager
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=8082

[Install]
WantedBy=multi-user.target
```

Активация службы:
```bash
sudo systemctl daemon-reload
sudo systemctl enable y2manager
sudo systemctl start y2manager
```

## Настройка веб-сервера (Nginx)

Создайте конфигурацию Nginx:
```bash
sudo nano /etc/nginx/sites-available/y2manager
```

Содержимое:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:8082;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Активация:
```bash
sudo ln -s /etc/nginx/sites-available/y2manager /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Управление службой

```bash
# Запуск
sudo systemctl start y2manager

# Остановка  
sudo systemctl stop y2manager

# Перезапуск
sudo systemctl restart y2manager

# Статус
sudo systemctl status y2manager

# Логи
sudo journalctl -u y2manager -f
```

## Обновление

1. Скачайте новую версию проекта
2. Остановите службу: `sudo systemctl stop y2manager`
3. Замените файлы в `/opt/yandex2mqtt/y2manager/`
4. Установите зависимости: `npm install`
5. Запустите службу: `sudo systemctl start y2manager`

## Резервное копирование

Важные файлы для резервного копирования:
- `/opt/yandex2mqtt/config.js` - конфигурация устройств
- `/opt/yandex2mqtt/y2manager/` - исходный код приложения

## Решение проблем

### Приложение не запускается
```bash
# Проверьте логи
sudo journalctl -u y2manager -n 50

# Проверьте права доступа
ls -la /opt/yandex2mqtt/config.js

# Убедитесь что Node.js установлен
node --version
npm --version
```

### Ошибка доступа к файлу config.js
```bash
# Проверьте существование файла
ls -la /opt/yandex2mqtt/config.js

# Установите правильные права
sudo chmod 644 /opt/yandex2mqtt/config.js
sudo chown $USER:$USER /opt/yandex2mqtt/config.js
```

### Порт занят
```bash
# Найдите процесс использующий порт 5000
sudo lsof -i :8082

# Измените порт в package.json или переменной окружения
export PORT=8082
```
