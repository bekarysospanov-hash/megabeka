import {
  APPLIANCE_ITEM_LABELS,
  APPLIANCE_MOUNT_LABELS,
  CATEGORY_LABELS,
  CONFIGURATION_LABELS,
  COUNTERTOP_COLOR_LABELS,
  COUNTERTOP_LABELS,
  FACADE_COLOR_LABELS,
  FACADE_MATERIAL_LABELS,
  FACADE_TYPE_LABELS,
  HARDWARE_LABELS,
  MATERIAL_LABELS,
  OPENING_SYSTEM_LABELS,
  QUALITY_LABELS,
  SPECIAL_MECHANISM_LABELS,
} from './orderSpecLabels'
import { formatDate, formatMoney } from './statusLabels'
import type { Deal } from './types'

export function generateContractText(deal: Deal): string {
  const clientName = deal.clientName || deal.contactName || '__________________'
  const category =
    deal.category === 'other' && deal.categoryCustom
      ? deal.categoryCustom
      : deal.category
        ? CATEGORY_LABELS[deal.category]
        : 'не указан'
  const configuration = deal.configuration ? CONFIGURATION_LABELS[deal.configuration] ?? deal.configuration : 'не указана'
  const dimensions =
    deal.heightMm != null || deal.depthMm != null
      ? `высота ${deal.heightMm ?? '—'} мм, глубина ${deal.depthMm ?? '—'} мм`
      : 'уточняются при замере на объекте'
  const length = deal.lengthMm != null ? `, длина (по стенам) — ${deal.lengthMm} мм` : ''
  const material = deal.material ? MATERIAL_LABELS[deal.material] ?? deal.material : 'уточняется'
  const facadeMaterial = deal.facadeMaterial
    ? FACADE_MATERIAL_LABELS[deal.facadeMaterial] ?? deal.facadeMaterial
    : 'уточняется'
  const facadeType = deal.facadeType ? FACADE_TYPE_LABELS[deal.facadeType] ?? deal.facadeType : 'уточняется'
  const countertop = deal.countertopType ? COUNTERTOP_LABELS[deal.countertopType] ?? deal.countertopType : null
  const facadeColor = deal.facadeColor ? FACADE_COLOR_LABELS[deal.facadeColor] ?? deal.facadeColor : 'уточняется'
  const countertopColor = deal.countertopColor
    ? COUNTERTOP_COLOR_LABELS[deal.countertopColor] ?? deal.countertopColor
    : null
  const quality = deal.qualityTier ? QUALITY_LABELS[deal.qualityTier] : 'уточняется'
  const hardware = deal.hardwareTier ? HARDWARE_LABELS[deal.hardwareTier] ?? deal.hardwareTier : 'уточняется'
  const openingSystem = deal.openingSystem
    ? OPENING_SYSTEM_LABELS[deal.openingSystem] ?? deal.openingSystem
    : 'уточняется'
  const drawerCount = deal.drawerCount != null ? `${deal.drawerCount} шт.` : null
  const specialMechanisms =
    deal.specialMechanisms.length > 0
      ? deal.specialMechanisms.map((m) => SPECIAL_MECHANISM_LABELS[m]).join(', ')
      : null
  const applianceMount = deal.applianceMount ? APPLIANCE_MOUNT_LABELS[deal.applianceMount] : null
  const appliances =
    deal.appliances.length > 0 ? deal.appliances.map((a) => APPLIANCE_ITEM_LABELS[a]).join(', ') : null
  const lighting = deal.lightingNeeded ? 'нужна (врезная светодиодная лента)' : null
  const extras = [
    drawerCount ? `выдвижных ящиков — ${drawerCount}` : null,
    specialMechanisms ? `специальные механизмы — ${specialMechanisms}` : null,
    applianceMount ? `техника — ${applianceMount}` : null,
    appliances ? `встраиваемая техника — ${appliances}` : null,
    lighting ? `подсветка — ${lighting}` : null,
  ].filter((s): s is string => s !== null)
  const extrasText = extras.length > 0 ? extras.join('; ') : 'не указано'
  const productionDeadline = deal.estimatedProductionDays != null
    ? `${deal.estimatedProductionDays} дн. с момента подписания настоящего Договора обеими Сторонами`
    : 'согласуется Сторонами дополнительно после проведения замера и уточнения характеристик'
  const today = formatDate(new Date().toISOString())

  return `ДОГОВОР ПОДРЯДА № ${deal.slug}
на изготовление мебели по индивидуальному заказу

«${today}»

Мебельщик, зарегистрированный на платформе Asia Mebel, именуемый в дальнейшем «Исполнитель», с одной стороны, и ${clientName}, именуем(ый/ая) в дальнейшем «Заказчик», с другой стороны, именуемые совместно «Стороны», заключили настоящий Договор о нижеследующем:

1. ПРЕДМЕТ ДОГОВОРА
1.1. Исполнитель обязуется изготовить и передать Заказчику мебель согласно согласованной спецификации (далее — «Изделие»), а Заказчик обязуется принять и оплатить Изделие на условиях настоящего Договора.
1.2. Наименование заказа: «${deal.title}».
1.3. Тип мебели: ${category}, конфигурация — ${configuration}.
1.4. Характеристики Изделия: размеры — ${dimensions}${length}; материал корпуса — ${material}; материал фасадов — ${facadeMaterial}; тип фасадов — ${facadeType}; цвет фасада — ${facadeColor}${countertop ? `; столешница — ${countertop}` : ''}${countertopColor ? `; цвет столешницы — ${countertopColor}` : ''}; класс фурнитуры — ${hardware}; система открывания — ${openingSystem}; уровень исполнения — ${quality}.
1.5. Дополнительно: ${extrasText}.
1.6. Указанные характеристики являются предварительными и могут быть уточнены Сторонами после проведения замера на объекте Заказчика.

2. ЦЕНА ДОГОВОРА И ПОРЯДОК РАСЧЁТОВ
2.1. Стоимость Изделия составляет ${formatMoney(deal.amount)} и является предварительной оценкой до проведения замера.
2.2. Заказчик оплачивает 100% стоимости на счёт платформы Asia Mebel в рамках сервиса «Безопасная сделка».
2.3. Оплата Заказчика поступает на счёт платформы ${deal.interimPercent > 0 ? 'тремя траншами' : 'двумя траншами'} и становится доступна Исполнителю на балансе платформы для запроса перевода: ${deal.interimPercent > 0 ? 'аванс' : 'предоплата'} в размере ${deal.prepaymentPercent}% — сразу после оплаты Заказчиком${deal.interimPercent > 0 ? `; промежуточный платёж в размере ${deal.interimPercent}% — в период изготовления Изделия` : ''}; окончательный платёж в размере ${deal.finalPercent}% — после подписания Сторонами акта приёма-передачи.
2.4. Платформа Asia Mebel выступает гарантом сделки по сервису «Безопасная сделка»: гарантирует Заказчику возврат оплаченной суммы, если сделка не будет исполнена, а Исполнителю — доступ к оплаченным траншам на балансе платформы при выполнении условий Договора.

3. СРОКИ
3.1. Срок изготовления Изделия: ${productionDeadline}.

4. ПРАВА И ОБЯЗАННОСТИ СТОРОН
4.1. Исполнитель обязуется изготовить Изделие в соответствии с согласованными характеристиками и передать его Заказчику в согласованный срок.
4.2. Заказчик обязуется обеспечить доступ для замера, своевременно произвести оплату и принять Изделие по акту приёма-передачи.
4.3. Любые изменения характеристик Изделия согласуются Сторонами через переписку на платформе Asia Mebel до подписания настоящего Договора.

5. ОТВЕТСТВЕННОСТЬ СТОРОН И РАЗРЕШЕНИЕ СПОРОВ
5.1. За неисполнение или ненадлежащее исполнение обязательств по настоящему Договору Стороны несут ответственность в соответствии с законодательством Республики Казахстан.
5.2. Споры, возникающие при исполнении Договора, Стороны разрешают путём переговоров, в том числе при участии оператора платформы Asia Mebel.

6. ФОРС-МАЖОР
6.1. Стороны освобождаются от ответственности за неисполнение обязательств, если оно явилось следствием обстоятельств непреодолимой силы, наступивших после заключения Договора.

7. ЗАКЛЮЧИТЕЛЬНЫЕ ПОЛОЖЕНИЯ
7.1. Договор считается заключённым с момента подписания обеими Сторонами посредством одноразового кода, направленного по СМС в системе Asia Mebel.
7.2. Настоящий текст является типовым шаблоном договора для пилотного тестирования сервиса «Безопасная сделка» и подлежит юридической доработке перед вводом в коммерческую эксплуатацию.

Исполнитель: подпись через СМС-код в системе Asia Mebel
Заказчик: ${clientName}, подпись через СМС-код в системе Asia Mebel`
}

export function generateActText(deal: Deal): string {
  const clientName = deal.clientName || deal.contactName || '__________________'
  const today = formatDate(new Date().toISOString())
  const finalAmount = Math.round((deal.amount * deal.finalPercent) / 100)

  return `АКТ ПРИЁМА-ПЕРЕДАЧИ
к Договору подряда № ${deal.slug} на изготовление мебели по индивидуальному заказу

«${today}»

Исполнитель, зарегистрированный на платформе Asia Mebel, передал, а Заказчик ${clientName} принял Изделие «${deal.title}», изготовленное в соответствии с условиями Договора подряда № ${deal.slug}.

1. ПРЕДМЕТ АКТА
1.1. Изделие соответствует характеристикам, согласованным Сторонами при подписании Договора.
1.2. На момент подписания настоящего Акта претензий по качеству, комплектности и срокам изготовления у Заказчика не имеется, либо они урегулированы Сторонами до подписания Акта.

2. ФИНАНСОВЫЕ ПОСЛЕДСТВИЯ
2.1. Настоящий Акт является основанием для перечисления Исполнителю окончательного платежа в размере ${formatMoney(finalAmount)} (${deal.finalPercent}% стоимости Изделия) через платформу Asia Mebel.
2.2. С момента подписания настоящего Акта обязательства Сторон по Договору подряда № ${deal.slug} считаются исполненными в полном объёме.

3. ПОДПИСАНИЕ
3.1. Акт подписывается Сторонами посредством одноразового кода, направленного по СМС в системе Asia Mebel.
3.2. Настоящий текст является типовым шаблоном для пилотного тестирования сервиса «Безопасная сделка» и подлежит юридической доработке перед вводом в коммерческую эксплуатацию.

Исполнитель: подпись через СМС-код в системе Asia Mebel
Заказчик: ${clientName}, подпись через СМС-код в системе Asia Mebel`
}
