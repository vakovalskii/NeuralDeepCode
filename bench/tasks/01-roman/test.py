from solution import roman_to_int
for r,n in [("III",3),("IV",4),("IX",9),("LVIII",58),("MCMXCIV",1994)]:
    assert roman_to_int(r)==n, (r, roman_to_int(r))
print("ALL PASS")
