module ImagesHelper
  private

  def add_attributes_to_opening_tag(element, attributes)
    element.gsub!(/\s(?:height|width|x|y)="\w*"/, '')
    new_opening_tag = '<svg '
    attributes.each_key do |attribute|
      new_opening_tag += "#{attribute}=\"#{attributes[attribute]}\" "
    end
    element.gsub!(/<svg\s/, new_opening_tag)
  end
end
