"""Seed Ch'hiwat Sans Gluten — menu Feadys (one-shot, sans sync)."""
import uuid
from decimal import Decimal

from django.contrib.auth.hashers import make_password
from django.db import migrations

SLUG = "ch-hiwat-sans-gluten"
OWNER_EMAIL = "chhiwat@yoha.ma"
OWNER_PASSWORD = "Chhiwat2026!"

COVER_URL = "https://ressources.feadys.com/img/img_ets/2024-2/zbhNKqau1LPyqL9uIn5EpOykivE2_6e369142-6af2-4e68-b1bb-1f5a98538753.jpg"
LOGO_URL = "https://yoha.ma/chain-img/patisserie-chhiwat-sans-gluten.jpg"

MENU = [
    ("Nos Pains المخبوزات", [
        ("F8XE1st8kc4seNsfhVpH", "Pain schar mix B خبز دقيق شار مكس ب", "9.00", "https://ressources.feadys.com/img/img_product/2023-11/zbhNKqau1LPyqL9uIn5EpOykivE2_11293077-95b6-41e4-b865-48e78f976289.jpg", "", True),
        ("UGmXuDjXuS2Nj2OJdhJE", "Pain farine millet. خبز بدقيق ايلان", "9.00", "https://ressources.feadys.com/img/img_product/2024-2/zbhNKqau1LPyqL9uIn5EpOykivE2_f39f1190-6d0e-4841-abdd-a7cbe84b9d46.jpg", "", True),
        ("zfIV6aodQMQzo8IcHHAh", "Baguette millet olives خبز ايلان", "8.00", "https://ressources.feadys.com/img/img_product/2024-2/zbhNKqau1LPyqL9uIn5EpOykivE2_ea617bef-b122-4928-bcb7-7eb3f3652e56.jpg", "", True),
        ("lf9VHXihlG3jhNK84XVA", "Betbout بطبوط", "8.00", "https://ressources.feadys.com/img/img_product/2024-2/zbhNKqau1LPyqL9uIn5EpOykivE2_7e149001-00a5-44e8-9852-a175a537ded4.jpg", "Pain à la farine de schar mix B, farine de riz", True),
        ("V1guXqFxHqyJPcf8PmeB", "Pain hamburgerخبز الهمبرغر", "8.00", "https://ressources.feadys.com/img/img_product/2023-11/zbhNKqau1LPyqL9uIn5EpOykivE2_c4b39c6e-9a84-45d7-a432-574c666f1067.jpg", "Pain à la farine de schar mix B", True),
        ("9Iy12src8B4hLkniwnOA", "Pain aux graines خبز بالزرارع", "10.00", "https://ressources.feadys.com/img/img_product/2023-11/zbhNKqau1LPyqL9uIn5EpOykivE2_bb847639-a9c7-446b-bd32-fce499b3b7a4.jpg", "Pain à la farine schar mix B et un mix de graines", True),
        ("HuEgQeGcALTijgCjY86v", "Baguette aux graines باكيط بالزرارع", "9.00", "https://ressources.feadys.com/img/img_product/2024-2/zbhNKqau1LPyqL9uIn5EpOykivE2_561ebb67-0115-40ee-987e-7fc84288ffb9.jpg", "", True),
        ("F4Sx9QtIPbvxktTGzMJ6", "Pain au sésame خبز بالجنجلان", "9.00", "https://ressources.feadys.com/img/img_product/2024-2/zbhNKqau1LPyqL9uIn5EpOykivE2_b911945b-afb7-47bc-a9fd-925881caf7e1.jpg", "", True),
        ("xTVagAYDcGnEMpIM5s38", "Pain de mie Toast", "75.00", "https://ressources.feadys.com/img/img_product/2024-2/zbhNKqau1LPyqL9uIn5EpOykivE2_a5f11d59-c641-4e01-b4c7-37129b4c773b.jpg", "", True),
        ("vIB3anfrdYb07iY7IXL9", "Fekkakes فقاقص", "12.00", "https://ressources.feadys.com/img/img_product/2024-2/zbhNKqau1LPyqL9uIn5EpOykivE2_12c36a9c-a907-48b3-8df6-81aa02568a13.jpg", "", True),
    ]),
    ("Notre Viennoiserie المعجنات", [
        ("oULpEhmwELCkDQDXckDK", "Pain au chocolat بتي بان الشكلاط", "10.00", "https://ressources.feadys.com/img/img_product/2023-11/zbhNKqau1LPyqL9uIn5EpOykivE2_61f02acc-cdbf-4a23-b991-3756c7100023.jpg", "", True),
        ("ucHVIlvYhT1x5NpMabvU", "Pain suisse فطائرسويس", "12.00", "https://ressources.feadys.com/img/img_product/2023-11/zbhNKqau1LPyqL9uIn5EpOykivE2_ad445645-257a-4161-bb79-97b38b1796a6.jpg", "", True),
        ("e7OhoWL8z7QDCsjjThBv", "Croissant nature", "8.00", "https://ressources.feadys.com/img/img_product/2023-11/zbhNKqau1LPyqL9uIn5EpOykivE2_f613fd83-4970-493c-9414-8f0a42305885.jpg", "", True),
        ("sPs4t3w3mgR9hsTCYqxm", "Croissant au chocolat كرواص بالشكلاط", "10.00", "https://ressources.feadys.com/img/img_product/2023-11/zbhNKqau1LPyqL9uIn5EpOykivE2_4188a609-f3b2-4dcf-9ae7-f9d36a25a7e7.jpg", "", True),
        ("bEGnjDDMh9hkEYrd2iMm", "Schneck aux raisins secs شنيك", "10.00", "https://ressources.feadys.com/img/img_product/2024-2/zbhNKqau1LPyqL9uIn5EpOykivE2_aa09fbaa-c9ab-4c1c-b14f-70ea3444fee4.jpg", "", True),
    ]),
    ("Nos Salés المملحات", [
        ("zUandPg0EhIlQUJOQM91", "Pastilla au poisson بسطيلة الحوت", "25.00", "https://ressources.feadys.com/img/img_product/2024-2/zbhNKqau1LPyqL9uIn5EpOykivE2_fba4ef37-ab18-4c5a-816c-104376ba0c33.jpg", "", True),
        ("e6K4OkmzvhQ7Z0h6xkG4", "Pizza au Thon بيتزا التون", "10.00", "https://ressources.feadys.com/img/img_product/2024-2/zbhNKqau1LPyqL9uIn5EpOykivE2_41db5951-463b-4042-b9c3-a20ec8a18658.jpg", "", True),
        ("TBdI5ttNw0ZUCbdNxbMN", "Nems viande hachée نيم كفتة", "12.00", "https://ressources.feadys.com/img/img_product/2023-11/zbhNKqau1LPyqL9uIn5EpOykivE2_6fac21cc-c531-41e7-9669-eb494a8b53f9.jpg", "", True),
        ("hEfIaMcjjhKKYKt1f1Qv", "Crêpes marocaines مسمن", "9.00", "https://ressources.feadys.com/img/img_product/2023-11/zbhNKqau1LPyqL9uIn5EpOykivE2_d3677673-0463-413c-8c17-b21d2787184f.jpg", "", True),
        ("I1cevGtLOdl5CUxtIUOc", "Crêpes farcies مسمن محشي", "12.00", "https://ressources.feadys.com/img/img_product/2024-2/zbhNKqau1LPyqL9uIn5EpOykivE2_0b03df3d-ca10-4f71-8440-d1db07d5cf6b.jpg", "", True),
        ("MHVrPE1BZo378EcwDaUk", "Chaussons à la viande hachée شوصون كفتة", "12.00", "https://ressources.feadys.com/img/img_product/2023-11/zbhNKqau1LPyqL9uIn5EpOykivE2_b23991a1-2338-4ac0-8e64-85bcafc62066.jpg", "", True),
        ("A3zTgucauS1KuxC1lTiN", "Chaussons au fromage شوصون جبن", "10.00", "https://ressources.feadys.com/img/img_product/2023-11/zbhNKqau1LPyqL9uIn5EpOykivE2_8f3dae0c-72c8-41e0-a889-e4511f6bb9d5.jpg", "", True),
        ("8d0ejTN19Z9L4o6P2kVf", "Quiches au poulet كيش دجاج", "12.00", "https://ressources.feadys.com/img/img_product/2023-11/zbhNKqau1LPyqL9uIn5EpOykivE2_3032a431-d762-469e-b06d-a524c7b3867f.jpg", "", True),
        ("YDJnYOm5ZpJW5JBVkBK2", "Nems au poulet et épinard نيم الدجاج", "12.00", "https://ressources.feadys.com/img/img_product/2023-11/zbhNKqau1LPyqL9uIn5EpOykivE2_6575973b-fd0c-4d89-98a7-22e4a31c941f.jpg", "", True),
        ("BsPSggPXO4CC8C1Tzyb5", "Baghrir بغرير", "7.00", "https://ressources.feadys.com/img/img_product/2023-11/zbhNKqau1LPyqL9uIn5EpOykivE2_6c6d077d-a4a4-45e6-8d3d-3e40da739a5b.jpg", "", True),
        ("TdqAtkJdjTNmaWDIPcLP", "ChicKen Burger شيكن برغر", "20.00", "https://ressources.feadys.com/img/img_product/2023-11/zbhNKqau1LPyqL9uIn5EpOykivE2_76034dbd-6c75-4dff-9e55-05822bcf006e.jpg", "", True),
        ("qDd99PXegRRpX4vIU34L", "Bestela au poulet بسطيلة دجاج", "20.00", "https://ressources.feadys.com/img/img_product/2023-11/zbhNKqau1LPyqL9uIn5EpOykivE2_b9340096-d339-43f6-9ec9-9feeb4ba150c.jpg", "", True),
        ("6qlSWvHOO4ZmmBxGSvya", "Harcha au mais حرشة بسميد الذرة", "5.00", "https://ressources.feadys.com/img/img_product/2024-2/zbhNKqau1LPyqL9uIn5EpOykivE2_702b3684-9247-4b0e-a6f4-470575e6c357.jpg", "", True),
        ("8mSb6Le19eMAudHO06He", "Pastilla au poulet بسطيلة بالدجاج", "250.00", "https://ressources.feadys.com/img/img_product/2024-2/zbhNKqau1LPyqL9uIn5EpOykivE2_9ac5f0b1-4638-427f-aea2-9cd7b0b60288.jpg", "", True),
    ]),
    ("Notre Pâtisserie الحلويات", [
        ("CWvqn77VzIXBNS3Nx9tC", "Lengua لنكوا", "20.00", "https://ressources.feadys.com/img/img_product/2023-11/zbhNKqau1LPyqL9uIn5EpOykivE2_b9e1d62b-eff8-49f2-be1d-c65706404a09.jpg", "Gâteau génoise noix et pate d'amande", True),
        ("AzgWT6JJKfZKBdAfpXHM", "Tarte au citron طرطة بالحامض", "20.00", "https://ressources.feadys.com/img/img_product/2024-2/zbhNKqau1LPyqL9uIn5EpOykivE2_04db4a88-2941-47c0-a2b5-440755462108.jpg", "", True),
        ("TmLlifs7xivRfQvYwkdC", "Cheese cake aux framboises شيز كيك", "20.00", "https://ressources.feadys.com/img/img_product/2024-2/zbhNKqau1LPyqL9uIn5EpOykivE2_d6f5f82e-7d37-40ab-91b2-fff721fb22a0.jpg", "", True),
        ("wUfPfy9EFMgT8yr2NGM8", "Brownie براوني", "18.00", "https://ressources.feadys.com/img/img_product/2023-11/zbhNKqau1LPyqL9uIn5EpOykivE2_8f8bd1c6-da71-4dcb-9307-5c9b67cdef15.jpg", "", True),
        ("Kar9ynVBL3IrTkKmUh5T", "Tranche au chocolatحلوى بالشكلاطة", "16.00", "https://ressources.feadys.com/img/img_product/2024-2/zbhNKqau1LPyqL9uIn5EpOykivE2_a6bba315-f8c8-4792-942f-17c618b4928f.jpg", "", True),
        ("Va85EWbofjnfWGWv8mwO", "Carotte Cake كيك بالجزر", "20.00", "https://ressources.feadys.com/img/img_product/2023-11/zbhNKqau1LPyqL9uIn5EpOykivE2_840b6ad3-8866-4844-b93d-05cce14912ee.jpg", "", True),
        ("TV3kTG8NKdQwjkViRl8B", "Tartelette aux amandes طورطات باللوز", "18.00", "https://ressources.feadys.com/img/img_product/2023-11/zbhNKqau1LPyqL9uIn5EpOykivE2_3e376c14-edb3-4f44-b412-b1ff7f897074.jpg", "", True),
        ("T0hdJssJNyEvo3SKfdlq", "Flan فلان", "20.00", "https://ressources.feadys.com/img/img_product/2024-2/zbhNKqau1LPyqL9uIn5EpOykivE2_ea317967-1860-42ae-ad7d-94d313852f83.jpg", "", True),
        ("TdkmeJl35VI770krjIrD", "Gâteau mousse au chocolat حلوىبالشكولاته", "20.00", "https://ressources.feadys.com/img/img_product/2024-2/zbhNKqau1LPyqL9uIn5EpOykivE2_d7062180-7b2e-43c1-92d6-707906ea1235.jpg", "", True),
    ]),
    ("Nos gâteaux marocains حلويات مغربية", [
        ("ye09s19boQFOvtnSYuXQ", "Blighat aux amandes بليغات باللوز", "65.00", "https://ressources.feadys.com/img/img_product/2023-11/zbhNKqau1LPyqL9uIn5EpOykivE2_c2d15054-e134-4b7f-8b56-1b6432094dd0.jpg", "250g", True),
        ("JVP9Ua7vVP06wqtqnDj9", "Sellou aux amandes سلو باللوز", "110.00", "https://ressources.feadys.com/img/img_product/2024-2/zbhNKqau1LPyqL9uIn5EpOykivE2_f94b7d06-e5e2-44f9-9558-95741016b459.jpg", "500g", True),
        ("rO6bh72wZ0nDT9IpbUqU", "Fekkas فقاص", "40.00", "https://ressources.feadys.com/img/img_product/2023-11/zbhNKqau1LPyqL9uIn5EpOykivE2_26f370c8-6b3e-43da-96b0-100557505dfa.jpg", "250 g", True),
        ("h1aqB1UyZ0t7W97Ixx77", "sablés salés aux amandes صابلي مالح", "40.00", "https://ressources.feadys.com/img/img_product/2023-11/zbhNKqau1LPyqL9uIn5EpOykivE2_8ce1e111-b53b-4e04-b66e-531db0897d3e.jpg", "250g", True),
        ("jXXRMOJDZ4kj2cqSB8D2", "Polborones حلوة البيان", "40.00", "https://ressources.feadys.com/img/img_product/2024-2/zbhNKqau1LPyqL9uIn5EpOykivE2_6db2b58b-3ded-42f4-ad49-9305bef9a5db.jpg", "250g", True),
        ("p0jRF8vszYhNct5cO3i2", "Lbehla aux amandesبهلة باللوز", "40.00", "https://ressources.feadys.com/img/img_product/2023-11/zbhNKqau1LPyqL9uIn5EpOykivE2_0a97c943-a4f8-4a1f-a882-3deb0d62475d.jpg", "250g", True),
        ("biN0BSixYdKCt6pje6Pi", "Mkiflat Kaekكعك", "40.00", "https://ressources.feadys.com/img/img_product/2023-11/zbhNKqau1LPyqL9uIn5EpOykivE2_a06c5b9d-53b6-4edf-83b8-aa7aaaaefebb.jpg", "250g", True),
        ("fZoxlHBrPDFCzOcbuRXe", "Gâteaux aux dattes حلوى التمر", "40.00", "https://ressources.feadys.com/img/img_product/2024-2/zbhNKqau1LPyqL9uIn5EpOykivE2_d3c68383-c194-4681-a2b3-5e143637a30c.jpg", "250g", True),
        ("LxBumF80A27Ssiuq0nSg", "Gâteaux aux amandesحلوى باللوز", "45.00", "https://ressources.feadys.com/img/img_product/2023-11/zbhNKqau1LPyqL9uIn5EpOykivE2_a6729216-b670-4d85-b132-458fea7a3239.jpg", "250g", True),
        ("Ir1osOF4WdhkU7RIHv2y", "Sablés aux noixصابلي بالجوز", "45.00", "https://ressources.feadys.com/img/img_product/2023-11/zbhNKqau1LPyqL9uIn5EpOykivE2_4ed512bc-2df5-4680-8432-fe648ad7ec85.jpg", "250g", True),
        ("S4Xc3fZpGxVee0Vi3YOZ", "Plateau prestigeحلوى برستيج", "280.00", "https://ressources.feadys.com/img/img_product/2024-2/zbhNKqau1LPyqL9uIn5EpOykivE2_7625c0fc-c52c-42be-9524-ca2ef4527ec6.jpg", "Grand plateau", True),
        ("eGpuEOs8AFgDlr79Cjl9", "Sablés à la confitureصابلي بالمربى", "40.00", "https://ressources.feadys.com/img/img_product/2024-2/zbhNKqau1LPyqL9uIn5EpOykivE2_d121a8a1-85e2-44ff-aaf2-7383c26744fb.jpg", "250g", True),
        ("n1UZVYUuAan5ZpNDHcOL", "Chebakiaشباكية", "65.00", "https://ressources.feadys.com/img/img_product/2024-2/zbhNKqau1LPyqL9uIn5EpOykivE2_fe93a09d-4e47-4d39-ae5f-95002cf807ac.jpg", "250g", True),
        ("c7GiRgkmgc5an927BdBf", "Mini fekkas فقاص صغيربالنافع", "30.00", "https://ressources.feadys.com/img/img_product/2024-2/zbhNKqau1LPyqL9uIn5EpOykivE2_816c908f-14a5-4d3b-bf9d-85010b841b72.jpg", "200g", True),
        ("NzyvkSMYjI5tGedDBllR", "Biscuit حلوى المكينة", "40.00", "https://ressources.feadys.com/img/img_product/2024-2/zbhNKqau1LPyqL9uIn5EpOykivE2_3f0334d2-1040-4afe-bb87-709d6247a069.jpg", "250g", True),
        ("ap4WJw36vEaGidw1Gv8g", "Cokies كوكيز", "7.00", "https://ressources.feadys.com/img/img_product/2024-2/zbhNKqau1LPyqL9uIn5EpOykivE2_f7d0d905-e8a3-4bc3-84ea-e03d959ec70e.jpg", "", True),
    ]),
    ("Nos Gâteaux d'anniversaire حلوى اعياد الميلاد", [
        ("NHsrEiSSU1oxD7sxRlVb", "Gâteau à la pâte d'amandes", "250.00", "https://ressources.feadys.com/img/img_product/2023-11/zbhNKqau1LPyqL9uIn5EpOykivE2_79ef606f-4a93-4067-8559-79bc343c5f9b.jpg", "طورطة بعجينة اللوز", True),
        ("o6CiQfMlhIhkcfi0qgGr", "Trianon au chocolatحلوى بموس الشكلاطة", "250.00", "https://ressources.feadys.com/img/img_product/2023-11/zbhNKqau1LPyqL9uIn5EpOykivE2_4fa7ad1d-39c8-4bbf-8cc1-251194d026ff.jpg", "", True),
        ("J2jaM49uqXxXnXpAx1Bu", "Gâteau opéra حلوى ابرا", "250.00", "https://ressources.feadys.com/img/img_product/2023-11/zbhNKqau1LPyqL9uIn5EpOykivE2_d5833708-f0ae-4b31-99bf-3339f0862ffa.jpg", "", True),
        ("wajVBUMLkQGY1oFa1kjO", "Carotte cake كيك بالجزر و الجوز", "250.00", "https://ressources.feadys.com/img/img_product/2023-11/zbhNKqau1LPyqL9uIn5EpOykivE2_59c2c606-d935-4834-9d1a-2dee1251d23a.jpg", "", True),
        ("nO5ep12FpJwAZsE5l2HT", "Gâteau au cafe حلوى بالقهوة", "250.00", "https://ressources.feadys.com/img/img_product/2023-11/zbhNKqau1LPyqL9uIn5EpOykivE2_39608fdc-0572-4821-ad3f-4be1040dbbce.jpg", "", True),
        ("zoLgts54Ozv6vUusKELj", "Bûche au chocolat بيش بالشكلاطة", "250.00", "https://ressources.feadys.com/img/img_product/2023-12/zbhNKqau1LPyqL9uIn5EpOykivE2_730daf28-0b71-4316-ac97-77f744dba8fa.jpg", "", True),
        ("yMKlaVaMXE1BNCUnrQwT", "Gâteau opera حلوى ابرا", "250.00", "https://ressources.feadys.com/img/img_product/2024-2/zbhNKqau1LPyqL9uIn5EpOykivE2_e4e12534-bee2-4f13-8f43-1271a3ec684c.jpg", "", True),
        ("NpT1hNc6khWVmCrvTC4p", "Mousse aux 3 chocolatsحلوى بموس الشكلا", "280.00", "https://ressources.feadys.com/img/img_product/2024-2/zbhNKqau1LPyqL9uIn5EpOykivE2_41c4fbdd-3af5-430a-8def-500e220535d1.jpg", "", True),
        ("vkjB6DtcF4PmMD7QwSLY", "Gâteau au chocolatحلوى بالشكلاطة", "250.00", "https://ressources.feadys.com/img/img_product/2024-2/zbhNKqau1LPyqL9uIn5EpOykivE2_c72083d5-a4ef-4ab6-8aa9-477607c2d4ec.jpg", "", True),
        ("LJPOntqqorAq4VuwjCHV", "Gâteau aux amandes حلوى باللوز", "250.00", "https://ressources.feadys.com/img/img_product/2024-2/zbhNKqau1LPyqL9uIn5EpOykivE2_6a35f7b9-e321-49b7-bb9b-7528f09d9814.jpg", "", True),
        ("DZaaKcAGq1YwWhLSTwNH", "Forêt Noire", "250.00", "https://ressources.feadys.com/img/img_product/2024-2/zbhNKqau1LPyqL9uIn5EpOykivE2_4ac07e1b-eae2-4d90-9346-5293d16e2cef.jpg", "", True),
    ]),
    ("Nos plats الوجبات", [
        ("axYSqzCgRWhAj3fd2uqQ", "Couscous marocainكسكس بالخضر والتفايا", "75.00", "https://ressources.feadys.com/img/img_product/2024-2/zbhNKqau1LPyqL9uIn5EpOykivE2_41d6cd41-5256-4cc3-b9de-06619406d2aa.jpg", "", True),
        ("xx2eUG36K1As0RK9h1oh", "Sandwich poulet ساندويش الدجاج", "70.00", "https://ressources.feadys.com/img/img_product/2024-2/zbhNKqau1LPyqL9uIn5EpOykivE2_cd8e28a9-720e-4cc6-89e3-afe449cb5189.jpg", "", True),
        ("myAg3CWD46x8q7txUE2f", "Pastilla prestigeبسطيلة بريستج", "250.00", "https://ressources.feadys.com/img/img_product/2024-2/zbhNKqau1LPyqL9uIn5EpOykivE2_f782878d-e6f3-46af-8763-48cbcd549c26.jpg", "", True),
    ]),
    ("Nos Cakes الكعكات", [
        ("F0Q8vEMOWirFtxLRs1YX", "Banana bread كيك بالموز", "50.00", "https://ressources.feadys.com/img/img_product/2024-2/zbhNKqau1LPyqL9uIn5EpOykivE2_e90f48ba-8ffd-4544-b754-c337279d4371.jpg", "", True),
        ("EvVYFov8lZGs4A4h5TNu", "Cake à l orange كيك بالبرتقال", "70.00", "https://ressources.feadys.com/img/img_product/2024-2/zbhNKqau1LPyqL9uIn5EpOykivE2_40bfcc5f-37e7-40ad-becd-d6f982978c17.jpg", "", True),
        ("TLZGlteOlvdI6YPght6O", "Cake aux dattes et noix كيك بالتمرا", "70.00", "https://ressources.feadys.com/img/img_product/2024-2/zbhNKqau1LPyqL9uIn5EpOykivE2_100e51b0-f70e-476d-bedf-b49ef2c6342c.jpg", "", True),
        ("NLYEv0zrkaLV7uC4Aifl", "Cake au citron كيك بالحامض", "50.00", "https://ressources.feadys.com/img/img_product/2024-2/zbhNKqau1LPyqL9uIn5EpOykivE2_342e649d-908e-4427-9dfd-e32f92940a65.jpg", "", True),
        ("g488tGAXQibmu3cTueHF", "Cake marbré كيك رخامي", "50.00", "https://ressources.feadys.com/img/img_product/2024-2/zbhNKqau1LPyqL9uIn5EpOykivE2_c82cd179-9026-4007-b991-66dab1b8ae77.jpg", "", True),
    ]),
]


def seed(apps, schema_editor):
    User = apps.get_model("accounts", "User")
    Restaurant = apps.get_model("restaurants", "Restaurant")
    MenuCategory = apps.get_model("restaurants", "MenuCategory")
    MenuItem = apps.get_model("restaurants", "MenuItem")

    owner, created = User.objects.get_or_create(
        email=OWNER_EMAIL,
        defaults={
            "id": uuid.uuid4(),
            "display_name": "Ch'hiwat Sans Gluten",
            "role": "restaurant",
            "is_active": True,
            "password": make_password(OWNER_PASSWORD),
        },
    )
    if not created:
        owner.role = "restaurant"
        owner.display_name = "Ch'hiwat Sans Gluten"
        owner.is_active = True
        owner.password = make_password(OWNER_PASSWORD)
        owner.save(update_fields=["role", "display_name", "is_active", "password"])

    # Liberer le OneToOne si un autre resto pointe deja sur ce compte
    Restaurant.objects.filter(owner_id=owner.id).exclude(slug=SLUG).update(owner=None)

    restaurant, _ = Restaurant.objects.update_or_create(
        slug=SLUG,
        defaults={
            "name": "Ch'hiwat Sans Gluten",
            "cuisine": "dessert",
            "tags": ["Sans gluten", "Pâtisserie", "Boulangerie", "Ch'hiwat"],
            "distance_label": "2.6 km",
            "delivery_time": "45-60 min",
            "promo_label": "",
            "fee_label": "20 DH",
            "cover_url": COVER_URL,
            "logo_url": LOGO_URL,
            "description": "Ch'hiwat Sans Gluten — A côté Masjid Badr, Tanger 90000. Pâtisserie et boulangerie 100 % sans gluten.",
            "phone": "+212612816917",
            "rating": "4.6",
            "is_active": True,
            "glovo_enabled": False,
            "owner": owner,
        },
    )

    for cat_order, (cat_name, items) in enumerate(MENU):
        cat, _ = MenuCategory.objects.get_or_create(
            restaurant=restaurant,
            name=cat_name,
            defaults={"sort_order": cat_order},
        )
        if cat.sort_order != cat_order:
            cat.sort_order = cat_order
            cat.save(update_fields=["sort_order"])
        for sort_i, (eid, name, price, image, desc, available) in enumerate(items):
            MenuItem.objects.update_or_create(
                restaurant=restaurant,
                external_id=eid,
                defaults={
                    "category": cat,
                    "name": name,
                    "description": desc,
                    "price_mad": Decimal(price),
                    "image_url": image,
                    "sort_order": sort_i,
                    "is_available": available,
                },
            )


def unseed(apps, schema_editor):
    Restaurant = apps.get_model("restaurants", "Restaurant")
    User = apps.get_model("accounts", "User")
    Restaurant.objects.filter(slug=SLUG).delete()
    User.objects.filter(email=OWNER_EMAIL).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("restaurants", "0017_restaurantoffer_item_ids"),
        ("accounts", "0005_userrequest"),
    ]

    operations = [
        migrations.RunPython(seed, unseed),
    ]
