# Hex Economy - ระบบเศรษฐกิจ

**👨‍💻 Created by K1Dev Team**  
[Join our Discord](https://discord.gg/vWcYNgAv8S) for support & updates!


## 🎬 ตัวอย่าง
[ชมวิดีโอตัวอย่าง (YouTube)](https://youtu.be/aUH7a8vynZ4)

## การติดตั้ง

1. วางโฟลเดอร์ `hex-economy` ใน `resources` ของเซิร์ฟเวอร์
2. เพิ่ม `ensure hex-economy` ใน `server.cfg`
3. รีสตาร์ทเซิร์ฟเวอร์

## การตั้งค่า

### config.lua

```lua
Config.UpdateInterval = 3600000 -- เวลาอัพเดทราคา (มิลลิวินาที) - 1 ชั่วโมง
Config.MinPriceMultiplier = 0.7 -- ราคาต่ำสุด (70% ของราคาพื้นฐาน)
Config.MaxPriceMultiplier = 1.3 -- ราคาสูงสุด (130% ของราคาพื้นฐาน)

-- จุดขายของ
Config.SellPoints = {
    {
        coords = vector3(-858.0591, -1337.3524, 44.4790), -- เปลี่ยนเป็นตำแหน่งที่ต้องการ
    }
}

-- รายการของที่ขายได้
Config.Items = {
    ["token"] = {  
        name = "โทเคน",
        basePrice = 10,    -- ราคาพื้นฐาน
        minPrice = 7,     -- ราคาต่ำสุด
        maxPrice = 13     -- ราคาสูงสุด
    },
    ["apple"] = {
        name = "แอปเปิ้ล",
        basePrice = 5,
        minPrice = 3,
        maxPrice = 7
    }
}
```

## คำสั่ง

- `/updateprices` - อัพเดทราคาใหม่ (สำหรับแอดมิน)

