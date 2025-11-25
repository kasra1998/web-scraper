# web-scraper
self-hosted n8n on ubuntu vps docker container to extract products detail such as price and stock and volume and put to google sheet and update daily
# performance cycle description :
The employer's goal was to compare the prices of the products on their website with four competitor websites. For this purpose, I prepared four scraper scripts tailored to the DOM structure of each target website. In the n8n workflow that I self-hosted on a VPS, I called the scripts that I had placed in Docker containers on Ubuntu on the VPS, and connected the JSON output through two intermediary nodes to the sheet node, so the data would be stored in the sheet. Three scripts in Google Apps Script within the Google Sheet were responsible for updating, backing up, and extracting the prices of similar products from the four reference sheets into the results sheet.



هدف کارفرما مقایسه قیمت محصولات وب سایت خود با چهار وب سایت رقیب بود. برای این کار چهار اسکریپت scraper متناسب با ساختار DOM هر وب سایت هدف تهیه کردم - در ورک فلو n8n که روی vps سلف هاست کردم اون اسکریپت هایی که روی داکر کانتینر ابونتو روی vps  قرار داده بودم رو فراخونی کردم که خروجی فایل json رو با ۲ نود میانجی وصل کردم به نود sheet دیتا میشینه روی شیت . ۳تا اسکریپت در app script داخل خود google sheet  وظیفه آپدیت - بکاپ گیری و استخراج قیمت محصولات مشابه از چهار شیت مرجع به شیت نتیجه رو داردند.
