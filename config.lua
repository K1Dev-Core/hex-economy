Config = {}


Config.UpdateInterval = 3600000 -- 1 hour  อัพเดททุกชั่วโมง
Config.MinPriceMultiplier = 0.7 -- คูณราคาขั้นต่ำ
Config.MaxPriceMultiplier = 1.3 -- คูณราคาขั้นสูงสุด

Config.SellPoints = {
    {
        coords = vector3(-858.0591, -1337.3524, 44.4790),
    },
    
}

Config.Items = {
    ["token"] = {  
        name = "โทเคน",
        basePrice = 10,
        minPrice = 7,
        maxPrice = 13
    },
    ["apple"] = {
        name = "แอปเปิ้ล",
        basePrice = 5,
        minPrice = 3,
        maxPrice = 7
    },
    ["banana"] = {
        name = "กล้วย",
        basePrice = 5,
        minPrice = 3,
        maxPrice = 7
    },
}