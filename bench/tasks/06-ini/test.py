from solution import parse_ini
t = "[a]\nx=1\ny = two\n[b]\nz=3\n"
r = parse_ini(t)
assert r == {"a":{"x":"1","y":"two"},"b":{"z":"3"}}, r
print("ALL PASS")
