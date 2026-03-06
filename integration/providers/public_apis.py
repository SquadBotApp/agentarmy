"""
Public APIs Integration Provider
This module provides async functions to access a variety of public APIs for fun, data, and utility.
"""

import aiohttp

# Example: async with aiohttp.ClientSession() as session: ...

async def get_public_apis():
    url = "https://api.publicapis.org/entries"
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as resp:
            return await resp.json()

async def get_cat_facts():
    url = "https://cat-fact.herokuapp.com/facts"
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as resp:
            return await resp.json()

async def get_bitcoin_price():
    url = "https://api.coindesk.com/v1/bpi/currentprice.json"
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as resp:
            return await resp.json()

async def get_bored_activity():
    url = "https://www.boredapi.com/api/activity"
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as resp:
            return await resp.json()

async def get_agify(name: str):
    url = f"https://api.agify.io?name={name}"
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as resp:
            return await resp.json()

async def get_genderize(name: str):
    url = f"https://api.genderize.io?name={name}"
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as resp:
            return await resp.json()

async def get_nationalize(name: str):
    url = f"https://api.nationalize.io?name={name}"
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as resp:
            return await resp.json()

async def get_data_usa():
    url = "https://datausa.io/api/data?drilldowns=Nation&measures=Population"
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as resp:
            return await resp.json()

async def get_random_dog():
    url = "https://dog.ceo/api/breeds/image/random"
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as resp:
            return await resp.json()

async def get_ipify():
    url = "https://api.ipify.org?format=json"
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as resp:
            return await resp.json()

async def get_ipinfo(ip: str):
    url = f"https://ipinfo.io/{ip}/geo"
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as resp:
            return await resp.json()

async def get_random_joke():
    url = "https://official-joke-api.appspot.com/random_joke"
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as resp:
            return await resp.json()

async def get_random_user():
    url = "https://randomuser.me/api/"
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as resp:
            return await resp.json()

async def get_universities(country: str):
    from urllib.parse import quote_plus
    url = f"http://universities.hipolabs.com/search?country={quote_plus(country)}"
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as resp:
            return await resp.json()

async def get_zip_info(zip_code: str):
    url = f"https://api.zippopotam.us/us/{zip_code}"
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as resp:
            return await resp.json()

# Add more APIs as needed following the above pattern.
